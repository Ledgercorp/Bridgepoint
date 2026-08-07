import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SharedResource {
  id: string;
  organization_id: string;
  shared_by: string;
  resource_data: Record<string, unknown>;
  resource_type: string;
  title: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sharer_name?: string;
}

interface UseORESReturn {
  sharedResources: SharedResource[];
  loading: boolean;
  syncing: boolean;
  lastSyncTime: Date | null;
  shareResource: (resource: Omit<SharedResource, 'id' | 'organization_id' | 'shared_by' | 'created_at' | 'updated_at' | 'sharer_name'>) => Promise<boolean>;
  updateResource: (id: string, updates: Partial<SharedResource>) => Promise<boolean>;
  removeResource: (id: string) => Promise<boolean>;
  refreshResources: () => Promise<void>;
}

export function useORES(organizationId: string | null): UseORESReturn {
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchResources = useCallback(async () => {
    if (!organizationId) {
      setSharedResources([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_shared_resources')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sharer names
      const sharerIds = [...new Set((data || []).map(r => r.shared_by))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name')
        .in('user_id', sharerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name || p.first_name || 'Staff'])
      );

      const resourcesWithNames = (data || []).map(r => ({
        ...r,
        resource_data: r.resource_data as Record<string, unknown>,
        sharer_name: profileMap.get(r.shared_by) || 'Staff'
      }));

      setSharedResources(resourcesWithNames);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching ORES resources:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const refreshResources = useCallback(async () => {
    setSyncing(true);
    await fetchResources();
    setSyncing(false);
  }, [fetchResources]);

  const shareResource = useCallback(async (
    resource: Omit<SharedResource, 'id' | 'organization_id' | 'shared_by' | 'created_at' | 'updated_at' | 'sharer_name'>
  ): Promise<boolean> => {
    if (!organizationId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('organization_shared_resources')
        .insert({
          organization_id: organizationId,
          shared_by: user.id,
          title: resource.title,
          resource_type: resource.resource_type,
          resource_data: resource.resource_data,
          notes: resource.notes,
          is_active: resource.is_active
        });

      if (error) throw error;

      toast({
        title: 'Resource shared',
        description: 'Resource synced to all staff members'
      });

      return true;
    } catch (error) {
      console.error('Error sharing resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to share resource',
        variant: 'destructive'
      });
      return false;
    }
  }, [organizationId, toast]);

  const updateResource = useCallback(async (
    id: string,
    updates: Partial<SharedResource>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_shared_resources')
        .update({
          title: updates.title,
          notes: updates.notes,
          resource_data: updates.resource_data,
          is_active: updates.is_active
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Resource updated',
        description: 'Changes synced to all staff members'
      });

      return true;
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resource',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const removeResource = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_shared_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Resource removed',
        description: 'Resource removed from shared pool'
      });

      return true;
    } catch (error) {
      console.error('Error removing resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove resource',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`ores-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_shared_resources',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('ORES realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            const newResource = payload.new as SharedResource;
            setSharedResources(prev => [
              { ...newResource, resource_data: newResource.resource_data as Record<string, unknown>, sharer_name: 'Staff' },
              ...prev
            ]);
            toast({
              title: 'New resource shared',
              description: `"${newResource.title}" added by a team member`
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SharedResource;
            setSharedResources(prev =>
              prev.map(r => r.id === updated.id
                ? { ...r, ...updated, resource_data: updated.resource_data as Record<string, unknown> }
                : r
              ).filter(r => r.is_active)
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setSharedResources(prev => prev.filter(r => r.id !== deleted.id));
          }

          setLastSyncTime(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, toast]);

  return {
    sharedResources,
    loading,
    syncing,
    lastSyncTime,
    shareResource,
    updateResource,
    removeResource,
    refreshResources
  };
}
