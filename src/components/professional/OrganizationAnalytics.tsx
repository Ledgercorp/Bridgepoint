import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Users, MessageSquare, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type OrganizationConnection = Database['public']['Tables']['organization_connections']['Row'];
type OrganizationBroadcast = Database['public']['Tables']['organization_broadcasts']['Row'];

interface OrganizationAnalyticsProps {
  organizationId: string;
}

export function OrganizationAnalytics({ organizationId }: OrganizationAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalConnections: 0,
    activeConnections: 0,
    totalBroadcasts: 0,
    recentBroadcasts: 0,
    seatUsage: { used: 0, total: 0 },
    memberActivity: [] as { date: string; count: number }[],
    broadcastActivity: [] as { date: string; count: number }[],
  });

  useEffect(() => {
    loadAnalytics();
  }, [organizationId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch organization members
      const { data: members } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organizationId);

      // Fetch organization connections
      const { data: connections } = await supabase
        .from("organization_connections")
        .select("*")
        .eq("organization_id", organizationId);

      // Fetch broadcasts
      const { data: broadcasts } = await supabase
        .from("organization_broadcasts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      // Fetch seat usage
      const { data: org } = await supabase
        .from("organizations")
        .select("subscription_seats")
        .eq("id", organizationId)
        .single();

      // Calculate active members (active in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeConnections = connections?.filter(
        (conn) => conn.is_active && conn.last_active && new Date(conn.last_active) > thirtyDaysAgo
      ).length || 0;

      // Calculate recent broadcasts (last 30 days)
      const recentBroadcasts = broadcasts?.filter(
        (b) => new Date(b.created_at) > thirtyDaysAgo
      ).length || 0;

      // Generate member activity data (last 7 days)
      const memberActivity = generateActivityData(connections || [], 7);

      // Generate broadcast activity data (last 7 days)
      const broadcastActivity = generateBroadcastData(broadcasts || [], 7);

      setAnalytics({
        totalMembers: members?.length || 0,
        activeMembers: members?.length || 0,
        totalConnections: connections?.length || 0,
        activeConnections,
        totalBroadcasts: broadcasts?.length || 0,
        recentBroadcasts,
        seatUsage: {
          used: members?.length || 0,
          total: org?.subscription_seats || 5,
        },
        memberActivity,
        broadcastActivity,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityData = (connections: OrganizationConnection[], days: number) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = connections.filter((conn) => {
        if (!conn.last_active) return false;
        const lastActive = new Date(conn.last_active);
        return lastActive >= dayStart && lastActive <= dayEnd;
      }).length;

      data.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });
    }
    return data;
  };

  const generateBroadcastData = (broadcasts: OrganizationBroadcast[], days: number) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = broadcasts.filter((broadcast) => {
        const createdAt = new Date(broadcast.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      data.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });
    }
    return data;
  };

  const seatUsageData = [
    { name: "Used", value: analytics.seatUsage.used, color: "hsl(var(--primary))" },
    { name: "Available", value: analytics.seatUsage.total - analytics.seatUsage.used, color: "hsl(var(--muted))" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Organization staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Broadcasts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBroadcasts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.recentBroadcasts} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seat Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.seatUsage.used}/{analytics.seatUsage.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.seatUsage.used / analytics.seatUsage.total) * 100)}% capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Activity (Last 7 Days)</CardTitle>
            <CardDescription>Daily active connections</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Active Users",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.memberActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Broadcast Activity (Last 7 Days)</CardTitle>
            <CardDescription>Broadcasts sent per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Broadcasts",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.broadcastActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seat Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Usage Distribution</CardTitle>
          <CardDescription>Organization membership capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              used: {
                label: "Used Seats",
                color: "hsl(var(--primary))",
              },
              available: {
                label: "Available Seats",
                color: "hsl(var(--muted))",
              },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seatUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {seatUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
