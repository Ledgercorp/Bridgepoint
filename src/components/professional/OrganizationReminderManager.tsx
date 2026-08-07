import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Calendar, Trash2, User } from "lucide-react";
import { format } from "date-fns";

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  reminder_type: string;
  is_completed: boolean;
  user_id: string;
}

interface ConnectedUser {
  user_id: string;
  email: string;
  first_name: string | null;
}

interface ConnectedUserJoin {
  user_id: string;
  user_profiles: {
    email: string;
    first_name: string | null;
  };
}

interface OrganizationReminderManagerProps {
  organizationId: string;
}

export function OrganizationReminderManager({ organizationId }: OrganizationReminderManagerProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [reminderType, setReminderType] = useState("appointment");

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from("organization_reminders")
        .select("*")
        .eq("organization_id", organizationId)
        .order("remind_at", { ascending: true });

      if (remindersError) throw remindersError;
      setReminders(remindersData || []);

      // Load connected users
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("organization_connections")
        .select(`
          user_id,
          user_profiles!inner(email, first_name)
        `)
        .eq("organization_id", organizationId)
        .eq("is_active", true);

      if (connectionsError) throw connectionsError;

      const users = ((connectionsData || []) as ConnectedUserJoin[]).map((conn) => ({
        user_id: conn.user_id,
        email: conn.user_profiles.email,
        first_name: conn.user_profiles.first_name,
      }));

      setConnectedUsers(users);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createReminder = async () => {
    if (!selectedUserId || !title || !remindAt) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("organization_reminders").insert({
        organization_id: organizationId,
        user_id: selectedUserId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        title,
        message: message || null,
        remind_at: remindAt,
        reminder_type: reminderType,
      });

      if (error) throw error;

      toast({
        title: "Reminder created",
        description: "The user will be notified at the scheduled time",
      });

      // Reset form
      setSelectedUserId("");
      setTitle("");
      setMessage("");
      setRemindAt("");
      setReminderType("appointment");

      loadData();
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("organization_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "The reminder has been removed",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading reminders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Reminder Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Reminder
          </CardTitle>
          <CardDescription>
            Send appointment reminders to connected community users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {connectedUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.first_name || user.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Appointment with social worker"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Additional details about the appointment..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="remind_at">Reminder Date & Time *</Label>
              <Input
                id="remind_at"
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createReminder} disabled={isCreating} className="w-full">
            {isCreating ? "Creating..." : "Create Reminder"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reminders</CardTitle>
          <CardDescription>
            Manage reminders you've created for connected users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const user = connectedUsers.find((u) => u.user_id === reminder.user_id);
                return (
                  <div
                    key={reminder.id}
                    className="flex items-start justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{reminder.title}</h4>
                        {reminder.is_completed && (
                          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                      {reminder.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {reminder.message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {user?.first_name || user?.email || "Unknown User"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(reminder.remind_at), "PPp")}
                        </div>
                        <span className="capitalize">{reminder.reminder_type}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
