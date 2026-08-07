import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: string;
  task_type: string;
  task_id: string;
  task_title: string;
  remind_at: string;
  is_completed: boolean;
}

export function useReminders(userId: string | undefined) {
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    checkReminders();

    // Check reminders every 5 minutes
    const interval = setInterval(checkReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  const checkReminders = async () => {
    if (!userId) return;

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("task_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("remind_at", now)
        .order("remind_at", { ascending: true });

      if (error) throw error;

      setPendingReminders(data || []);

      // Show gentle reminder if there are pending ones
      if (data && data.length > 0 && !sessionStorage.getItem("reminderShown")) {
        toast({
          title: "Gentle Reminder",
          description: `${data[0].task_title} is here whenever you're ready.`,
          duration: 6000,
        });
        sessionStorage.setItem("reminderShown", "true");
      }
    } catch (error) {
      console.error("Error checking reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("task_reminders")
        .update({ is_completed: true })
        .eq("id", reminderId);

      if (error) throw error;

      setPendingReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error("Error completing reminder:", error);
    }
  };

  return {
    pendingReminders,
    isLoading,
    completeReminder,
    refreshReminders: checkReminders,
  };
}
