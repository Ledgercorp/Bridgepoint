import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export const useEventRSVP = (eventId: string | null, userId: string | undefined) => {
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadRSVP = async () => {
    if (!eventId || !userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setRsvp(data);
    } catch (error) {
      console.error('Error loading RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRSVP = async (status: string) => {
    if (!eventId || !userId) return;

    try {
      if (rsvp) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('id', rsvp.id);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: userId,
            status,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `RSVP updated to ${status}`,
      });

      loadRSVP();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update RSVP',
        variant: 'destructive',
      });
    }
  };

  const removeRSVP = async () => {
    if (!rsvp) return;

    try {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('id', rsvp.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'RSVP removed',
      });

      setRsvp(null);
    } catch (error) {
      console.error('Error removing RSVP:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove RSVP',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadRSVP();
  }, [eventId, userId]);

  return {
    rsvp,
    loading,
    updateRSVP,
    removeRSVP,
    refreshRSVP: loadRSVP,
  };
};
