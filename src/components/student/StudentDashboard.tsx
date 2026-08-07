import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, BookOpen, Users, Bell, ArrowRight, CheckCircle2 } from "lucide-react";
import { format, isToday, formatDistanceToNow } from "date-fns";

interface RecentActivity {
  id: string;
  activity_type: string;
  item_title: string;
  created_at: string;
}

interface UpcomingLesson {
  id: string;
  title: string;
  order_index: number;
}

interface StudyRoomNotification {
  id: string;
  room_name: string;
  status: string;
  requested_at: string;
}

interface StudentDashboardProps {
  userId: string;
}

export function StudentDashboard({ userId }: StudentDashboardProps) {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [studyRoomNotifications, setStudyRoomNotifications] = useState<StudyRoomNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load recent activity
      const { data: activityData } = await supabase
        .from("recent_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activityData) setRecentActivity(activityData);

      // Load upcoming lessons (lessons not yet completed)
      const { data: completedLessons } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("status", "completed");

      const completedLessonIds = completedLessons?.map(l => l.lesson_id) || [];

      const { data: allLessons } = await supabase
        .from("mini_lessons")
        .select("id, title, order_index")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(10);

      if (allLessons) {
        const upcoming = allLessons
          .filter(lesson => !completedLessonIds.includes(lesson.id))
          .slice(0, 3);
        setUpcomingLessons(upcoming);
      }

      // Load study room notifications (pending join requests)
      const { data: notificationsData } = await supabase
        .from("pending_study_participants")
        .select(`
          id,
          status,
          requested_at,
          room_id,
          study_rooms (
            name
          )
        `)
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false })
        .limit(5);

      if (notificationsData) {
        const notifications = notificationsData.map(n => ({
          id: n.id,
          room_name: n.study_rooms?.name || "Unknown Room",
          status: n.status,
          requested_at: n.requested_at
        }));
        setStudyRoomNotifications(notifications);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "lesson_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "resource_viewed":
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, "MMM d, h:mm a");
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </div>
          <CardDescription>Your latest actions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity yet. Start exploring!
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 text-sm">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {activity.item_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatActivityTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Lessons */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Upcoming Lessons</CardTitle>
          </div>
          <CardDescription>Continue your learning</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              You've completed all available lessons! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                  onClick={() => navigate("/mini-lessons")}
                >
                  <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                    {index + 1}
                  </Badge>
                  <p className="text-sm font-medium flex-1 truncate">
                    {lesson.title}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate("/mini-lessons")}
              >
                View All Lessons
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Room Notifications */}
      <Card className="bg-gradient-to-br from-pink-500/5 to-orange-500/5 border-pink-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg">Study Rooms</CardTitle>
          </div>
          <CardDescription>Join requests & updates</CardDescription>
        </CardHeader>
        <CardContent>
          {studyRoomNotifications.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No pending requests
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/study-rooms")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Browse Study Rooms
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {studyRoomNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-2 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-pink-600" />
                    <p className="text-sm font-medium truncate flex-1">
                      {notification.room_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {notification.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatActivityTime(notification.requested_at)}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate("/study-rooms")}
              >
                View All Rooms
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
