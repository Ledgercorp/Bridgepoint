import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamTask {
  id: string;
  organization_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  assignee_name?: string;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

export interface OrgMember {
  user_id: string;
  display_name: string;
  role: string;
}

interface UseTeamBoardReturn {
  tasks: TeamTask[];
  members: OrgMember[];
  loading: boolean;
  createTask: (task: Omit<TeamTask, 'id' | 'organization_id' | 'created_by' | 'completed_at' | 'created_at' | 'updated_at' | 'creator_name' | 'assignee_name' | 'comment_count'>) => Promise<boolean>;
  updateTask: (id: string, updates: Partial<TeamTask>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  addComment: (taskId: string, content: string) => Promise<boolean>;
  getComments: (taskId: string) => Promise<TaskComment[]>;
  refreshTasks: () => Promise<void>;
}

export function useTeamBoard(organizationId: string | null, userId: string | null): UseTeamBoardReturn {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      return;
    }

    try {
      const { data: memberData, error } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const userIds = (memberData || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name || p.first_name || 'Team Member'])
      );

      setMembers((memberData || []).map(m => ({
        user_id: m.user_id,
        display_name: profileMap.get(m.user_id) || 'Team Member',
        role: m.role
      })));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [organizationId]);

  const fetchTasks = useCallback(async () => {
    if (!organizationId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_board_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user names
      const userIds = [...new Set([
        ...(data || []).map(t => t.created_by),
        ...(data || []).filter(t => t.assigned_to).map(t => t.assigned_to)
      ])].filter(Boolean);

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name || p.first_name || 'Staff'])
      );

      // Get comment counts
      const taskIds = (data || []).map(t => t.id);
      const { data: commentCounts } = await supabase
        .from('team_board_comments')
        .select('task_id')
        .in('task_id', taskIds);

      const countMap = new Map<string, number>();
      (commentCounts || []).forEach(c => {
        countMap.set(c.task_id, (countMap.get(c.task_id) || 0) + 1);
      });

      setTasks((data || []).map(t => ({
        ...t,
        status: t.status as TeamTask['status'],
        priority: t.priority as TeamTask['priority'],
        creator_name: profileMap.get(t.created_by),
        assignee_name: t.assigned_to ? profileMap.get(t.assigned_to) : undefined,
        comment_count: countMap.get(t.id) || 0
      })));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createTask = useCallback(async (
    task: Omit<TeamTask, 'id' | 'organization_id' | 'created_by' | 'completed_at' | 'created_at' | 'updated_at' | 'creator_name' | 'assignee_name' | 'comment_count'>
  ): Promise<boolean> => {
    if (!organizationId || !userId) return false;

    try {
      const { error } = await supabase
        .from('team_board_tasks')
        .insert({
          organization_id: organizationId,
          created_by: userId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          assigned_to: task.assigned_to
        });

      if (error) throw error;

      toast({ title: 'Task created' });
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
      return false;
    }
  }, [organizationId, userId, toast]);

  const updateTask = useCallback(async (id: string, updates: Partial<TeamTask>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) {
        updateData.status = updates.status;
        if (updates.status === 'done') {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }
      }
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;

      const { error } = await supabase
        .from('team_board_tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Task updated' });
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_board_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Task deleted' });
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
      return false;
    }
  }, [fetchTasks, toast]);

  const addComment = useCallback(async (taskId: string, content: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('team_board_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content
        });

      if (error) throw error;

      toast({ title: 'Comment added' });
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
      return false;
    }
  }, [userId, toast]);

  const getComments = useCallback(async (taskId: string): Promise<TaskComment[]> => {
    try {
      const { data, error } = await supabase
        .from('team_board_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.display_name || p.first_name || 'Staff'])
      );

      return (data || []).map(c => ({
        ...c,
        user_name: profileMap.get(c.user_id)
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [fetchTasks, fetchMembers]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`team-board-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_board_tasks',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, fetchTasks]);

  return {
    tasks,
    members,
    loading,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getComments,
    refreshTasks: fetchTasks
  };
}
