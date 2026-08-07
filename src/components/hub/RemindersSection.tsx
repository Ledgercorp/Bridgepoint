import { Bell, Check, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Reminder {
  id: string;
  task_title: string;
  task_type: string;
  remind_at: string;
  is_completed: boolean;
}

interface RemindersSectionProps {
  reminders: Reminder[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RemindersSection({ reminders, onComplete, onDelete }: RemindersSectionProps) {
  if (reminders.length === 0) {
    return null;
  }

  const upcomingReminders = reminders.filter(r => !r.is_completed);

  if (upcomingReminders.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle>Upcoming Reminders</CardTitle>
          </div>
          <Badge variant="secondary">{upcomingReminders.length}</Badge>
        </div>
        <CardDescription>Tasks that need your attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-3 p-3 bg-background rounded-lg border"
            >
              <Clock className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{reminder.task_title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(reminder.remind_at), "PPp")}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComplete(reminder.id)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reminder.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
