import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BulletinBoard } from "./BulletinBoard";
import { OrganizationProgramsViewer } from "./OrganizationProgramsViewer";
import { SharedResourceBundlesViewer } from "./SharedResourceBundlesViewer";
import { useOrganizationReminders } from "@/hooks/useOrganizationReminders";
import { Bell, Check, X } from "lucide-react";
import { format } from "date-fns";
import {
  Building2,
  MessageSquare,
  Calendar,
  Package,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface MyOrganizationProps {
  organizationId: string;
  organizationName: string;
}

interface OrganizationStats {
  programCount: number;
  upcomingEvents: number;
  activeBroadcasts: number;
}

export const MyOrganization = ({ organizationId, organizationName }: MyOrganizationProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrganizationStats>({
    programCount: 0,
    upcomingEvents: 0,
    activeBroadcasts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const { reminders, completeReminder } = useOrganizationReminders(userId);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      // Get programs count
      const { count: programCount } = await supabase
        .from('organization_programs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Get upcoming events count
      const { count: eventsCount } = await supabase
        .from('organization_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_public', true)
        .gte('start_time', new Date().toISOString());

      // Get active broadcasts count
      const { count: broadcastsCount } = await supabase
        .from('organization_broadcasts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      setStats({
        programCount: programCount || 0,
        upcomingEvents: eventsCount || 0,
        activeBroadcasts: broadcastsCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card className="border-2 bg-gradient-to-br from-background to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  My Organization
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  {organizationName}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Programs Card */}
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Programs</div>
                <div className="text-2xl font-bold">{stats.programCount}</div>
              </div>
            </div>

            {/* Events Card */}
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Upcoming Events</div>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              </div>
            </div>

            {/* Announcements Card */}
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Announcements</div>
                <div className="text-2xl font-bold">{stats.activeBroadcasts}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/support-threads')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Organization
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // For demo org, show a message; for real orgs, navigate to their hub
                if (organizationId === 'demo-org-id') {
                  navigate('/browse-organizations');
                } else {
                  navigate(`/hub/${organizationId}`);
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Hub
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/browse-organizations')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Browse Organizations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Reminders */}
      {reminders.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Your Reminders
            </CardTitle>
            <CardDescription>
              Upcoming appointments and reminders from your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-background"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{reminder.title}</h4>
                    <Badge variant="outline" className="capitalize">
                      {reminder.reminder_type}
                    </Badge>
                  </div>
                  {reminder.message && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {reminder.message}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(reminder.remind_at), "PPp")}
                  </div>
                  {reminder.organizations && (
                    <div className="text-xs text-muted-foreground mt-1">
                      From: {reminder.organizations.name}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => completeReminder(reminder.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bulletin Board - Combined Broadcasts & Events */}
      <BulletinBoard organizationId={organizationId} organizationName={organizationName} />

      {/* Programs Section */}
      <OrganizationProgramsViewer organizationId={organizationId} />

      {/* Shared Resource Bundles Section */}
      <SharedResourceBundlesViewer organizationId={organizationId} />
    </div>
  );
};