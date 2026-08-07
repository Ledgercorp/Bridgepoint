import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface SupportThread {
  id: string;
  organization_id: string;
  community_user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ThreadMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'community' | 'staff';
  message_content: string;
  is_moderated: boolean;
  moderation_flags: Json | null;
  created_at: string;
}

export const useSupportThreads = (organizationId?: string) => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadThreads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setThreads([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('support_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast({
        title: "Error",
        description: "Failed to load support threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createThread = async (subject: string, initialMessage: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      if (!organizationId) throw new Error('Organization ID required');

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('support_threads')
        .insert({
          organization_id: organizationId,
          community_user_id: session.user.id,
          subject,
          status: 'open',
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Moderate and add first message
      const success = await sendMessage(thread.id, initialMessage);

      if (success) {
        await loadThreads();
        return thread.id;
      }

      return null;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create support thread",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (threadId: string, message: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Moderate message first
      const { data: moderation, error: moderationError } = await supabase.functions.invoke(
        'moderate-thread-message',
        {
          body: { message, threadId }
        }
      );

      if (moderationError) throw moderationError;

      if (!moderation.safe) {
        toast({
          title: "Message Blocked",
          description: moderation.reason || "This message contains information that cannot be shared for safety reasons",
          variant: "destructive",
        });

        if (moderation.suggested_alternative) {
          toast({
            title: "Try This Instead",
            description: moderation.suggested_alternative,
          });
        }

        return false;
      }

      // Determine sender type
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_mode')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const senderType = profile?.current_mode === 'professional' ? 'staff' : 'community';

      // Send message
      const { error } = await supabase
        .from('thread_messages')
        .insert({
          thread_id: threadId,
          sender_id: session.user.id,
          sender_type: senderType,
          message_content: message,
          is_moderated: true,
        });

      if (error) throw error;

      // Update thread updated_at
      await supabase
        .from('support_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  };

  const closeThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('support_threads')
        .update({ status: 'closed' })
        .eq('id', threadId);

      if (error) throw error;

      await loadThreads();

      toast({
        title: "Thread Closed",
        description: "This support thread has been closed",
      });
    } catch (error) {
      console.error('Error closing thread:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close thread",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadThreads();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('support-threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_threads',
        },
        () => {
          loadThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return {
    threads,
    loading,
    createThread,
    sendMessage,
    closeThread,
    refreshThreads: loadThreads,
  };
};
