import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Plus, Trash2, Users, Check, HelpCircle, X } from "lucide-react";
import { format } from "date-fns";

interface RSVPCounts {
  attending: number;
  maybe: number;
  not_attending: number;
}

interface OrganizationEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  rsvpCounts?: RSVPCounts;
}

interface OrganizationEventsManagerProps {
  organizationId: string;
}

export const OrganizationEventsManager = ({ organizationId }: OrganizationEventsManagerProps) => {
  const [events, setEvents] = useState<OrganizationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "workshop",
    start_time: "",
    end_time: "",
    location: "",
    is_public: true,
  });

  useEffect(() => {
    loadEvents();
  }, [organizationId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("start_time", { ascending: false });

      if (error) throw error;

      // Load RSVP counts for each event
      const eventsWithRSVPs = await Promise.all(
        (data || []).map(async (event) => {
          const { data: rsvps, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("status")
            .eq("event_id", event.id);

          if (rsvpError) {
            console.error("Error loading RSVPs:", rsvpError);
            return event;
          }

          const rsvpCounts = {
            attending: rsvps?.filter((r) => r.status === "attending").length || 0,
            maybe: rsvps?.filter((r) => r.status === "maybe").length || 0,
            not_attending: rsvps?.filter((r) => r.status === "not_attending").length || 0,
          };

          return { ...event, rsvpCounts };
        })
      );

      setEvents(eventsWithRSVPs);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("organization_events").insert({
        organization_id: organizationId,
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        location: formData.location || null,
        is_public: formData.is_public,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      setFormData({
        title: "",
        description: "",
        event_type: "workshop",
        start_time: "",
        end_time: "",
        location: "",
        is_public: true,
      });
      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("organization_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events Management</h2>
          <p className="text-muted-foreground">Create and manage events for your community</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Fill in the details for your event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="event_type">Event Type *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="social">Social Event</SelectItem>
                    <SelectItem value="info_session">Info Session</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Physical address or online meeting link"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="is_public">Public Event (visible to all connected users)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Event</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No events yet. Create your first event above.
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {event.title}
                      {!event.is_public && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">Private</span>
                      )}
                    </CardTitle>
                    <CardDescription className="capitalize">{event.event_type}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(event.start_time), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(event.start_time), "p")}
                      {event.end_time && ` - ${format(new Date(event.end_time), "p")}`}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                {event.rsvpCounts && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">RSVPs:</span>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      {event.rsvpCounts.attending} Attending
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <HelpCircle className="h-3 w-3 text-yellow-600" />
                      {event.rsvpCounts.maybe} Maybe
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <X className="h-3 w-3 text-red-600" />
                      {event.rsvpCounts.not_attending} Can't Go
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
