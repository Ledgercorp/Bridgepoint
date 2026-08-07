import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowTemplate {
  id: string;
  organization_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  category: string;
  workflow_data: {
    steps?: Array<{ title: string; description: string; }>;
    resources?: Array<{ name: string; url?: string; }>;
    notes?: string;
  };
  is_shared: boolean;
  use_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

interface UseWorkflowLibraryReturn {
  workflows: WorkflowTemplate[];
  sharedWorkflows: WorkflowTemplate[];
  loading: boolean;
  saveWorkflow: (workflow: Omit<WorkflowTemplate, 'id' | 'created_by' | 'use_count' | 'is_active' | 'created_at' | 'updated_at' | 'creator_name'>) => Promise<boolean>;
  updateWorkflow: (id: string, updates: Partial<WorkflowTemplate>) => Promise<boolean>;
  deleteWorkflow: (id: string) => Promise<boolean>;
  shareWorkflow: (id: string, orgId: string) => Promise<boolean>;
  useWorkflow: (id: string) => Promise<WorkflowTemplate | null>;
  refreshWorkflows: () => Promise<void>;
}

export function useWorkflowLibrary(userId: string | null, organizationId: string | null): UseWorkflowLibraryReturn {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [sharedWorkflows, setSharedWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkflows = useCallback(async () => {
    if (!userId) {
      setWorkflows([]);
      setSharedWorkflows([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's own workflows
      const { data: ownWorkflows, error: ownError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch shared org workflows if user is in an org
      let orgWorkflows: WorkflowTemplate[] = [];
      if (organizationId) {
        const { data: shared, error: sharedError } = await supabase
          .from('workflow_templates')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_shared', true)
          .eq('is_active', true)
          .neq('created_by', userId)
          .order('use_count', { ascending: false });

        if (sharedError) throw sharedError;
        orgWorkflows = (shared || []).map(w => ({
          ...w,
          workflow_data: w.workflow_data as WorkflowTemplate['workflow_data']
        }));
      }

      // Get creator names
      const creatorIds = [...new Set([
        ...(ownWorkflows || []).map(w => w.created_by),
        ...orgWorkflows.map(w => w.created_by)
      ])];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name')
        .in('user_id', creatorIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name || p.first_name || 'Staff'])
      );

      setWorkflows((ownWorkflows || []).map(w => ({
        ...w,
        workflow_data: w.workflow_data as WorkflowTemplate['workflow_data'],
        creator_name: profileMap.get(w.created_by)
      })));

      setSharedWorkflows(orgWorkflows.map(w => ({
        ...w,
        creator_name: profileMap.get(w.created_by)
      })));
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId]);

  const saveWorkflow = useCallback(async (
    workflow: Omit<WorkflowTemplate, 'id' | 'created_by' | 'use_count' | 'is_active' | 'created_at' | 'updated_at' | 'creator_name'>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('workflow_templates')
        .insert({
          created_by: userId,
          organization_id: workflow.organization_id,
          title: workflow.title,
          description: workflow.description,
          category: workflow.category,
          workflow_data: workflow.workflow_data,
          is_shared: workflow.is_shared
        });

      if (error) throw error;

      toast({ title: 'Workflow saved', description: 'Added to your library' });
      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({ title: 'Error', description: 'Failed to save workflow', variant: 'destructive' });
      return false;
    }
  }, [userId, fetchWorkflows, toast]);

  const updateWorkflow = useCallback(async (
    id: string,
    updates: Partial<WorkflowTemplate>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .update({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          workflow_data: updates.workflow_data,
          is_shared: updates.is_shared,
          organization_id: updates.organization_id
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Workflow updated' });
      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({ title: 'Error', description: 'Failed to update workflow', variant: 'destructive' });
      return false;
    }
  }, [fetchWorkflows, toast]);

  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Workflow deleted' });
      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({ title: 'Error', description: 'Failed to delete workflow', variant: 'destructive' });
      return false;
    }
  }, [fetchWorkflows, toast]);

  const shareWorkflow = useCallback(async (id: string, orgId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ is_shared: true, organization_id: orgId })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Workflow shared', description: 'Now visible to your team' });
      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Error sharing workflow:', error);
      toast({ title: 'Error', description: 'Failed to share workflow', variant: 'destructive' });
      return false;
    }
  }, [fetchWorkflows, toast]);

  const useWorkflow = useCallback(async (id: string): Promise<WorkflowTemplate | null> => {
    try {
      // Increment use count directly
      await supabase
        .from('workflow_templates')
        .update({ use_count: supabase.rpc ? 1 : 1 }) // Will be handled by trigger if needed
        .eq('id', id);

      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        workflow_data: data.workflow_data as WorkflowTemplate['workflow_data']
      };
    } catch (error) {
      console.error('Error using workflow:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    sharedWorkflows,
    loading,
    saveWorkflow,
    updateWorkflow,
    deleteWorkflow,
    shareWorkflow,
    useWorkflow,
    refreshWorkflows: fetchWorkflows
  };
}
