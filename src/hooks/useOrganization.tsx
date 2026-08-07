import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  subscription_seats: number;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member';
  invited_by: string | null;
  joined_at: string;
  user_profiles?: {
    email: string;
    display_name: string | null;
    first_name: string | null;
  };
}

interface SeatUsage {
  total_seats: number;
  used_seats: number;
  available_seats: number;
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's organization membership
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        if (memberError.code !== 'PGRST116') { // Not found is OK
          throw memberError;
        }
        setLoading(false);
        return;
      }

      const org = membership.organizations as unknown as Organization;
      setOrganization(org);
      setIsAdmin(membership.role === 'admin');

      // Load members
      await loadMembers(org.id);

      // Load seat usage
      await loadSeatUsage(org.id);

      setLoading(false);
    } catch (error) {
      console.error('Error loading organization:', error);
      // Only show a toast for real errors, not when no organization exists yet
      if (error?.code && error.code !== 'PGRST116') {
        toast({
          title: 'Error',
          description: 'Failed to load organization data',
          variant: 'destructive',
        });
      }
      setLoading(false);
    }
  };

  const loadMembers = async (orgId: string) => {
    // Get organization members
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false });

    if (membersError) throw membersError;

    // Get user profiles for these members
    const userIds = membersData?.map(m => m.user_id) || [];
    if (userIds.length === 0) {
      setMembers([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, first_name')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Merge the data
    const mergedData = membersData?.map(member => ({
      ...member,
      user_profiles: profilesData?.find(p => p.user_id === member.user_id) || null,
    })) || [];

    setMembers(mergedData);
  };

  const loadSeatUsage = async (orgId: string) => {
    const { data, error } = await supabase
      .rpc('get_organization_seat_usage', { org_id: orgId });

    if (error) throw error;
    if (data && data.length > 0) {
      setSeatUsage(data[0]);
    }
  };

  const createOrganization = async (name: string, domain?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, domain })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      await loadOrganization();
      return org;
    } catch (error) {
      console.error('Error creating organization:', error);
      const message = error?.message?.includes('row-level security')
        ? 'Organization setup is limited to verified Professional organizations. Please ensure your account is approved.'
        : 'Failed to create organization';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id);

      if (error) throw error;

      await loadOrganization();
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive',
      });
      return false;
    }
  };

  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    if (!organization || !isAdmin) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('organization_invites')
        .insert({
          organization_id: organization.id,
          email,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Invitation Sent',
        description: `Invite sent to ${email}`,
      });
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organization || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await loadOrganization();
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!organization || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      await loadOrganization();
      toast({
        title: 'Success',
        description: 'Member role updated',
      });
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    organization,
    members,
    seatUsage,
    isAdmin,
    loading,
    createOrganization,
    updateOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
    refreshOrganization: loadOrganization,
  };
}
