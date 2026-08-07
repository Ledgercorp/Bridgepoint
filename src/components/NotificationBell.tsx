import { useState, useEffect } from "react";
import { Bell, Check, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isPast, parseISO, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "reminder" | "task_due" | "org_reminder";
  title: string;
  message?: string;
  due_at: string;
  is_overdue: boolean;
  source_id: string;
}

interface NotificationBellProps {
  userId: string | null;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 2);

      // Fetch task reminders
      const { data: reminders } = await supabase
        .from("task_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("remind_at", tomorrow.toISOString())
        .order("remind_at", { ascending: true });

      // Fetch organization reminders for this user
      const { data: orgReminders } = await supabase
        .from("organization_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("remind_at", tomorrow.toISOString())
        .order("remind_at", { ascending: true });

      // Fetch team board tasks assigned to user that are due soon
      const { data: tasks } = await supabase
        .from("team_board_tasks")
        .select("*")
        .eq("assigned_to", userId)
        .neq("status", "done")
        .not("due_date", "is", null)
        .lte("due_date", tomorrow.toISOString())
        .order("due_date", { ascending: true });

      const allNotifications: Notification[] = [];

      // Process reminders
      (reminders || []).forEach((r) => {
        allNotifications.push({
          id: `reminder-${r.id}`,
          type: "reminder",
          title: r.task_title,
          due_at: r.remind_at,
          is_overdue: isPast(parseISO(r.remind_at)),
          source_id: r.id,
        });
      });

      // Process org reminders
      (orgReminders || []).forEach((r) => {
        allNotifications.push({
          id: `org-${r.id}`,
          type: "org_reminder",
          title: r.title,
          message: r.message || undefined,
          due_at: r.remind_at,
          is_overdue: isPast(parseISO(r.remind_at)),
          source_id: r.id,
        });
      });

      // Process task due dates
      (tasks || []).forEach((t) => {
        if (t.due_date) {
          allNotifications.push({
            id: `task-${t.id}`,
            type: "task_due",
            title: t.title,
            due_at: t.due_date,
            is_overdue: isPast(parseISO(t.due_date)),
            source_id: t.id,
          });
        }
      });

      // Sort by due date
      allNotifications.sort((a, b) =>
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const dismissNotification = async (notification: Notification) => {
    try {
      if (notification.type === "reminder") {
        await supabase
          .from("task_reminders")
          .update({ is_completed: true })
          .eq("id", notification.source_id);
      } else if (notification.type === "org_reminder") {
        await supabase
          .from("organization_reminders")
          .update({ is_completed: true })
          .eq("id", notification.source_id);
      }
      // For task_due, we don't dismiss - user needs to complete the task

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const formatDueTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isPast(date)) {
      return `Overdue by ${formatDistanceToNow(date)}`;
    }
    if (isToday(date)) {
      return "Due today";
    }
    if (isTomorrow(date)) {
      return "Due tomorrow";
    }
    return `Due ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "task_due":
        return <Calendar className="h-4 w-4" />;
      case "org_reminder":
        return <Bell className="h-4 w-4" />;
    }
  };

  const overdueCount = notifications.filter((n) => n.is_overdue).length;
  const totalCount = notifications.length;

  if (!userId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                overdueCount > 0 ? "bg-destructive" : "bg-primary"
              )}
            >
              {totalCount > 9 ? "9+" : totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {overdueCount > 0 && (
            <p className="text-xs text-destructive">
              {overdueCount} overdue item{overdueCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors",
                    notification.is_overdue && "bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 p-1.5 rounded-full",
                        notification.is_overdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {notification.is_overdue ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        getIcon(notification.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      )}
                      <p
                        className={cn(
                          "text-xs mt-1",
                          notification.is_overdue
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatDueTime(notification.due_at)}
                      </p>
                    </div>
                    {notification.type !== "task_due" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => dismissNotification(notification)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
