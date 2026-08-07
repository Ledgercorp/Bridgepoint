import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import {
  Pin,
  Megaphone,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  broadcast_type: string;
  created_at: string;
  expires_at: string | null;
  isRead: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  event_type: string;
}

interface BulletinBoardProps {
  organizationId: string;
  organizationName: string;
}

export const BulletinBoard = ({ organizationId, organizationName }: BulletinBoardProps) => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBulletinItems();

    // Subscribe to new broadcasts
    const channel = supabase
      .channel('bulletin-board')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_broadcasts',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          loadBulletinItems();
          toast({
            title: "📌 New Post on Bulletin Board",
            description: "Your organization just pinned a new announcement!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const loadBulletinItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get broadcasts
      const { data: broadcastsData, error: broadcastsError } = await supabase
        .from('organization_broadcasts')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(6);

      if (broadcastsError) throw broadcastsError;

      // Get read status
      const { data: readsData } = await supabase
        .from('broadcast_reads')
        .select('broadcast_id')
        .eq('user_id', user.id);

      const readIds = new Set(readsData?.map(r => r.broadcast_id) || []);

      const enrichedBroadcasts = (broadcastsData || []).map(b => ({
        ...b,
        isRead: readIds.has(b.id),
      }));

      setBroadcasts(enrichedBroadcasts);

      // Get upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from('organization_events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(4);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error loading bulletin board:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (broadcastId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('broadcast_reads')
        .insert({
          user_id: user.id,
          broadcast_id: broadcastId,
        });

      setBroadcasts(prev =>
        prev.map(b =>
          b.id === broadcastId ? { ...b, isRead: true } : b
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNoteColor = (type: string, index: number) => {
    const colors = [
      'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
      'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
      'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
      'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
    ];

    if (type === 'alert') return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    return colors[index % colors.length];
  };

  const getRotation = (index: number) => {
    const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0', '-rotate-1'];
    return rotations[index % rotations.length];
  };

  const getBroadcastIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'announcement': return <Megaphone className="h-4 w-4 text-blue-600" />;
      case 'update': return <Info className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading bulletin board...</div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = broadcasts.filter(b => !b.isRead).length;

  return (
    <Card className="border-2 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10 overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center rotate-3">
              <Pin className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {organizationName} Bulletin Board
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {unreadCount} New
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Stay updated with announcements and events
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {broadcasts.length === 0 && events.length === 0 ? (
          <div className="text-center py-12">
            <Pin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No posts on the bulletin board yet</p>
            <p className="text-sm text-muted-foreground/70">Check back soon for updates from your organization</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Broadcasts as sticky notes */}
            {broadcasts.map((broadcast, index) => (
              <div
                key={broadcast.id}
                className={`relative p-4 rounded-lg border-2 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${getNoteColor(broadcast.broadcast_type, index)} ${getRotation(index)} ${!broadcast.isRead ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={() => !broadcast.isRead && markAsRead(broadcast.id)}
              >
                {/* Pin decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-md border-2 border-red-600" />

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getBroadcastIcon(broadcast.broadcast_type)}
                      <Badge variant="outline" className="text-xs capitalize bg-background/50">
                        {broadcast.broadcast_type}
                      </Badge>
                    </div>
                    {!broadcast.isRead && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        New
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-bold text-foreground leading-tight">
                    {broadcast.title}
                  </h4>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {broadcast.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-current/10">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                    </span>
                    {!broadcast.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(broadcast.id);
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Events as sticky notes */}
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`relative p-4 rounded-lg border-2 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${getNoteColor('event', broadcasts.length + index)} ${getRotation(broadcasts.length + index)}`}
              >
                {/* Pin decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-md border-2 border-blue-600" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <Badge variant="outline" className="text-xs bg-background/50">
                      Event
                    </Badge>
                  </div>

                  <h4 className="font-bold text-foreground leading-tight">
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-1 pt-2 border-t border-current/10">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.start_time), "EEE, MMM d 'at' h:mm a")}
                    </div>
                    {event.location && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View more link */}
        {(broadcasts.length > 0 || events.length > 0) && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="gap-2">
              View All Updates
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
