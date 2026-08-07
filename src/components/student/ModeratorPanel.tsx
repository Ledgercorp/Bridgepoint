import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Clock } from "lucide-react";

interface PendingRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: string;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

interface ModeratorPanelProps {
  roomId: string;
}

export const ModeratorPanel = ({ roomId }: ModeratorPanelProps) => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`room-${roomId}-pending`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pending_study_participants', filter: `room_id=eq.${roomId}` },
        () => fetchPendingRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_study_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .order('requested_at');

      if (error) throw error;

      // Fetch user profiles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, email')
            .eq('user_id', request.user_id)
            .maybeSingle();

          return {
            ...request,
            profiles: profile
          };
        })
      );

      setPendingRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update request status
      const { error: updateError } = await supabase
        .from('pending_study_participants')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to participants
      const { error: insertError } = await supabase
        .from('study_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
        });

      if (insertError) throw insertError;

      // Log moderation action
      await supabase
        .from('study_room_moderation_log')
        .insert({
          room_id: roomId,
          moderator_id: user.id,
          action: 'approved_participant',
          target_user_id: userId,
        });

      toast({
        title: "Success",
        description: "Member approved and added to room",
      });

      fetchPendingRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('pending_study_participants')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log moderation action
      await supabase
        .from('study_room_moderation_log')
        .insert({
          room_id: roomId,
          moderator_id: user.id,
          action: 'rejected_participant',
          target_user_id: userId,
        });

      toast({
        title: "Request Rejected",
        description: "Join request has been rejected",
      });

      fetchPendingRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading requests...</p>;

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No pending join requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Join Requests
          <Badge variant="secondary">{pendingRequests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">
                  {request.profiles?.display_name || request.profiles?.email || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested {new Date(request.requested_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(request.id, request.user_id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(request.id, request.user_id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
