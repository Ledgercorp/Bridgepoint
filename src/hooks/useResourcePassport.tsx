import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PassportEntry {
  id: string;
  passport_id: string;
  entry_type: string;
  title: string;
  issuer: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  status: string;
  verification_code: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PassportShare {
  id: string;
  passport_id: string;
  share_code: string;
  shared_with_org: string | null;
  shared_with_user: string | null;
  access_level: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  org_name?: string;
}

export interface ResourcePassport {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  entries: PassportEntry[];
  shares: PassportShare[];
}

interface UseResourcePassportReturn {
  passport: ResourcePassport | null;
  loading: boolean;
  createPassport: () => Promise<string | null>;
  addEntry: (entry: Omit<PassportEntry, 'id' | 'passport_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateEntry: (id: string, updates: Partial<PassportEntry>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  createShare: (orgId?: string, expiresInDays?: number) => Promise<string | null>;
  revokeShare: (shareId: string) => Promise<boolean>;
  refreshPassport: () => Promise<void>;
}

export function useResourcePassport(userId: string | null): UseResourcePassportReturn {
  const [passport, setPassport] = useState<ResourcePassport | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPassport = useCallback(async () => {
    if (!userId) {
      setPassport(null);
      setLoading(false);
      return;
    }

    try {
      // Get or create passport
      const { data: existingPassport, error } = await supabase
        .from('resource_passports')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let passportData = existingPassport;

      if (error) throw error;

      if (!passportData) {
        // Auto-create passport for user
        const { data: newPassport, error: createError } = await supabase
          .from('resource_passports')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        passportData = newPassport;
      }

      // Fetch entries
      const { data: entries, error: entriesError } = await supabase
        .from('passport_entries')
        .select('*')
        .eq('passport_id', passportData.id)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Fetch shares
      const { data: shares, error: sharesError } = await supabase
        .from('passport_shares')
        .select('*')
        .eq('passport_id', passportData.id)
        .eq('is_active', true);

      if (sharesError) throw sharesError;

      // Get org names for shares
      const orgIds = (shares || []).filter(s => s.shared_with_org).map(s => s.shared_with_org);
      let orgMap = new Map<string, string>();

      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        orgMap = new Map((orgs || []).map(o => [o.id, o.name]));
      }

      setPassport({
        ...passportData,
        entries: (entries || []).map(e => ({
          ...e,
          metadata: (e.metadata || {}) as Record<string, unknown>
        })),
        shares: (shares || []).map(s => ({
          ...s,
          org_name: s.shared_with_org ? orgMap.get(s.shared_with_org) : undefined
        }))
      });
    } catch (error) {
      console.error('Error fetching passport:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createPassport = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('resource_passports')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;
      await fetchPassport();
      return data.id;
    } catch (error) {
      console.error('Error creating passport:', error);
      return null;
    }
  }, [userId, fetchPassport]);

  const addEntry = useCallback(async (
    entry: Omit<PassportEntry, 'id' | 'passport_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!passport) return false;

    try {
      const { error } = await supabase
        .from('passport_entries')
        .insert({
          passport_id: passport.id,
          entry_type: entry.entry_type,
          title: entry.title,
          issuer: entry.issuer,
          issued_date: entry.issued_date,
          expiry_date: entry.expiry_date,
          status: entry.status,
          verification_code: entry.verification_code,
          notes: entry.notes,
          metadata: entry.metadata
        });

      if (error) throw error;

      toast({ title: 'Entry added', description: 'Credential added to your passport' });
      await fetchPassport();
      return true;
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({ title: 'Error', description: 'Failed to add entry', variant: 'destructive' });
      return false;
    }
  }, [passport, fetchPassport, toast]);

  const updateEntry = useCallback(async (
    id: string,
    updates: Partial<PassportEntry>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('passport_entries')
        .update({
          title: updates.title,
          issuer: updates.issuer,
          issued_date: updates.issued_date,
          expiry_date: updates.expiry_date,
          status: updates.status,
          notes: updates.notes,
          metadata: updates.metadata
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Entry updated' });
      await fetchPassport();
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({ title: 'Error', description: 'Failed to update entry', variant: 'destructive' });
      return false;
    }
  }, [fetchPassport, toast]);

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('passport_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Entry removed' });
      await fetchPassport();
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: 'Error', description: 'Failed to remove entry', variant: 'destructive' });
      return false;
    }
  }, [fetchPassport, toast]);

  const createShare = useCallback(async (
    orgId?: string,
    expiresInDays?: number
  ): Promise<string | null> => {
    if (!passport) return null;

    try {
      const shareCode = `PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('passport_shares')
        .insert({
          passport_id: passport.id,
          share_code: shareCode,
          shared_with_org: orgId || null,
          expires_at: expiresAt,
          is_active: true
        });

      if (error) throw error;

      toast({ title: 'Share link created', description: `Code: ${shareCode}` });
      await fetchPassport();
      return shareCode;
    } catch (error) {
      console.error('Error creating share:', error);
      toast({ title: 'Error', description: 'Failed to create share link', variant: 'destructive' });
      return null;
    }
  }, [passport, fetchPassport, toast]);

  const revokeShare = useCallback(async (shareId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('passport_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (error) throw error;

      toast({ title: 'Share revoked' });
      await fetchPassport();
      return true;
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({ title: 'Error', description: 'Failed to revoke share', variant: 'destructive' });
      return false;
    }
  }, [fetchPassport, toast]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  return {
    passport,
    loading,
    createPassport,
    addEntry,
    updateEntry,
    deleteEntry,
    createShare,
    revokeShare,
    refreshPassport: fetchPassport
  };
}
