import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrganizationReminder {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  reminder_type: string;
  is_completed: boolean;
  organization_id: string;
  organizations?: {
    name: string;
  };
}

export function useOrganizationReminders(userId: string | undefined) {
  const [reminders, setReminders] = useState<OrganizationReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    loadReminders();

    // Check reminders every 5 minutes
    const interval = setInterval(loadReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  const loadReminders = async () => {
    if (!userId) return;

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("organization_reminders")
        .select(`
          *,
          organizations(name)
        `)
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("remind_at", now)
        .order("remind_at", { ascending: true });

      if (error) throw error;

      setReminders(data || []);

      // Show toast for new reminders
      if (data && data.length > 0 && !sessionStorage.getItem("orgReminderShown")) {
        toast({
          title: "Organization Reminder",
          description: `${data[0].title} from ${data[0].organizations?.name || "your organization"}`,
          duration: 8000,
        });
        sessionStorage.setItem("orgReminderShown", "true");
      }
    } catch (error) {
      console.error("Error loading organization reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("organization_reminders")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", reminderId);

      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== reminderId));

      toast({
        title: "Reminder completed",
        description: "The reminder has been marked as complete",
      });
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to complete reminder",
        variant: "destructive",
      });
    }
  };

  return {
    reminders,
    isLoading,
    completeReminder,
    refreshReminders: loadReminders,
  };
}
