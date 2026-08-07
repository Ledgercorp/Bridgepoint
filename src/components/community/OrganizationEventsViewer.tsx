import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Download, Check, X, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  rsvpStatus?: 'attending' | 'maybe' | 'not_attending' | null;
}

interface OrganizationEventsViewerProps {
  organizationId: string;
}

export const OrganizationEventsViewer = ({ organizationId }: OrganizationEventsViewerProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [organizationId]);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from('organization_events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (eventsError) throw eventsError;

      // Get RSVP status
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', user.id);

      if (rsvpsError) throw rsvpsError;

      const rsvpMap = new Map(rsvpsData?.map(r => [r.event_id, r.status]) || []);

      const enrichedEvents = (eventsData || []).map(e => ({
        ...e,
        rsvpStatus: rsvpMap.get(e.id) || null,
      }));

      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Could not load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, status: 'attending' | 'maybe' | 'not_attending') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          user_id: user.id,
          event_id: eventId,
          status,
        });

      if (error) throw error;

      // Update local state
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId ? { ...e, rsvpStatus: status } : e
        )
      );

      toast({
        title: "RSVP Updated",
        description: `You are ${status === 'attending' ? 'attending' : status === 'maybe' ? 'tentatively attending' : 'not attending'} this event`,
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: "Error",
        description: "Could not update RSVP",
        variant: "destructive",
      });
    }
  };

  const downloadICS = (event: Event) => {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Calendar Event Downloaded",
      description: "Add this to your calendar app",
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'workshop': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'meeting': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'event': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'training': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>Events and activities from your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No upcoming events scheduled
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Events and activities from your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 border-2 rounded-lg bg-gradient-to-br from-background to-muted/20 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
                    {event.event_type}
                  </Badge>
                  {event.rsvpStatus && (
                    <Badge variant="secondary" className="text-xs">
                      {event.rsvpStatus === 'attending' && <><Check className="h-3 w-3 mr-1" /> Attending</>}
                      {event.rsvpStatus === 'maybe' && <><HelpCircle className="h-3 w-3 mr-1" /> Maybe</>}
                      {event.rsvpStatus === 'not_attending' && <><X className="h-3 w-3 mr-1" /> Not Attending</>}
                    </Badge>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(event.start_time), 'PPp')}</span>
                    {event.end_time && (
                      <span>- {format(new Date(event.end_time), 'p')}</span>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(event.start_time), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant={event.rsvpStatus === 'attending' ? 'default' : 'outline'}
                onClick={() => handleRSVP(event.id, 'attending')}
              >
                <Check className="h-3 w-3 mr-1" />
                Attending
              </Button>
              <Button
                size="sm"
                variant={event.rsvpStatus === 'maybe' ? 'default' : 'outline'}
                onClick={() => handleRSVP(event.id, 'maybe')}
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Maybe
              </Button>
              <Button
                size="sm"
                variant={event.rsvpStatus === 'not_attending' ? 'default' : 'outline'}
                onClick={() => handleRSVP(event.id, 'not_attending')}
              >
                <X className="h-3 w-3 mr-1" />
                Can't Go
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadICS(event)}
              >
                <Download className="h-3 w-3 mr-1" />
                Add to Calendar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};