import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReminderDialogProps {
  open: boolean;
  onClose: () => void;
  taskType: string;
  taskId: string;
  taskTitle: string;
  userId: string;
}

export function ReminderDialog({
  open,
  onClose,
  taskType,
  taskId,
  taskTitle,
  userId,
}: ReminderDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const setReminder = async (days: number, label: string) => {
    setIsSaving(true);
    try {
      const remindAt = new Date();
      remindAt.setDate(remindAt.getDate() + days);

      const { error } = await supabase.from("task_reminders").insert({
        user_id: userId,
        task_type: taskType,
        task_id: taskId,
        task_title: taskTitle,
        remind_at: remindAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Reminder Set",
        description: `You'll be gently reminded ${label.toLowerCase()}`,
      });
      onClose();
    } catch (error) {
      console.error("Error setting reminder:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set reminder",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Set a Gentle Reminder
          </DialogTitle>
          <DialogDescription>
            Your saved steps are here whenever you're ready. No pressure—just a gentle nudge when you choose.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => setReminder(1, "Tomorrow")}
            disabled={isSaving}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <Calendar className="h-4 w-4 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Remind me tomorrow</div>
              <div className="text-xs text-muted-foreground">
                You'll see this task again tomorrow
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setReminder(3, "In a few days")}
            disabled={isSaving}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <Calendar className="h-4 w-4 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Remind me in a few days</div>
              <div className="text-xs text-muted-foreground">
                You'll see this task in 3 days
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setReminder(7, "Later this week")}
            disabled={isSaving}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <Calendar className="h-4 w-4 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Remind me later this week</div>
              <div className="text-xs text-muted-foreground">
                You'll see this task in about a week
              </div>
            </div>
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Not right now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          You can disable reminders anytime in Settings
        </p>
      </DialogContent>
    </Dialog>
  );
}
