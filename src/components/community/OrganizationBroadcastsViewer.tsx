import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  broadcast_type: string;
  created_at: string;
  expires_at: string | null;
  isRead: boolean;
}

interface OrganizationBroadcastsViewerProps {
  organizationId: string;
}

export const OrganizationBroadcastsViewer = ({ organizationId }: OrganizationBroadcastsViewerProps) => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBroadcasts();

    // Subscribe to new broadcasts
    const channel = supabase
      .channel('organization-broadcasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_broadcasts',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          loadBroadcasts();
          toast({
            title: "New Announcement",
            description: "Your organization has posted a new message",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const loadBroadcasts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get broadcasts
      const { data: broadcastsData, error: broadcastsError } = await supabase
        .from('organization_broadcasts')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (broadcastsError) throw broadcastsError;

      // Get read status
      const { data: readsData, error: readsError } = await supabase
        .from('broadcast_reads')
        .select('broadcast_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set(readsData?.map(r => r.broadcast_id) || []);

      const enrichedBroadcasts = (broadcastsData || []).map(b => ({
        ...b,
        isRead: readIds.has(b.id),
      }));

      setBroadcasts(enrichedBroadcasts);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
      toast({
        title: "Error",
        description: "Could not load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (broadcastId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('broadcast_reads')
        .insert({
          user_id: user.id,
          broadcast_id: broadcastId,
        });

      if (error && !error.message.includes('duplicate key')) {
        throw error;
      }

      // Update local state
      setBroadcasts(prev =>
        prev.map(b =>
          b.id === broadcastId ? { ...b, isRead: true } : b
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getBroadcastIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-5 w-5" />;
      case 'announcement': return <Megaphone className="h-5 w-5" />;
      case 'update': return <Info className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getBroadcastVariant = (type: string): "default" | "destructive" => {
    switch (type) {
      case 'alert': return 'destructive';
      default: return 'default';
    }
  };

  const getBroadcastColor = (type: string) => {
    switch (type) {
      case 'alert': return 'from-red-500/10 to-orange-500/10 border-red-500/20';
      case 'announcement': return 'from-blue-500/10 to-cyan-500/10 border-blue-500/20';
      case 'update': return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
      default: return 'from-primary/10 to-primary/5 border-primary/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading announcements...</div>
        </CardContent>
      </Card>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Stay updated with the latest from your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No announcements at this time
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = broadcasts.filter(b => !b.isRead).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <CardTitle>Announcements</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2">
                {unreadCount} New
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Updates and messages from your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {broadcasts.map((broadcast) => (
          <Alert
            key={broadcast.id}
            variant={getBroadcastVariant(broadcast.broadcast_type)}
            className={`bg-gradient-to-br ${getBroadcastColor(broadcast.broadcast_type)} border-2 ${!broadcast.isRead ? 'shadow-lg' : 'opacity-75'}`}
          >
            <div className="flex items-start gap-3">
              {getBroadcastIcon(broadcast.broadcast_type)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{broadcast.title}</div>
                  {!broadcast.isRead && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <AlertDescription className="text-sm">
                  {broadcast.message}
                </AlertDescription>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                  </div>
                  {!broadcast.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => markAsRead(broadcast.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};