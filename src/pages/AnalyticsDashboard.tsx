import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserMode } from "@/hooks/useUserMode";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Loader2, BarChart3, TrendingUp, Users,
  FolderKanban, Activity, Calendar, Download, PieChart
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();
  const { organization, loading: orgLoading } = useOrganization();

  const [stats, setStats] = useState({
    totalBundles: 0,
    bundleShares: 0,
    bundleClaims: 0,
    activeConnections: 0,
    totalBroadcasts: 0,
    eventsCreated: 0
  });
  const [loading, setLoading] = useState(true);

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  useEffect(() => {
    if (organization) {
      loadAnalytics();
    }
  }, [organization]);

  useEffect(() => {
    if (!userLoading && !orgLoading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, userLoading, orgLoading, navigate]);

  const loadAnalytics = async () => {
    if (!organization) return;

    try {
      // Load various stats
      const [bundlesRes, sharesRes, connectionsRes, broadcastsRes, eventsRes] = await Promise.all([
        supabase.from('resource_bundles').select('id', { count: 'exact' }),
        supabase.from('bundle_shares').select('id, current_claims', { count: 'exact' }),
        supabase.from('organization_connections').select('id', { count: 'exact' }).eq('organization_id', organization.id).eq('is_active', true),
        supabase.from('organization_broadcasts').select('id', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('organization_events').select('id', { count: 'exact' }).eq('organization_id', organization.id)
      ]);

      const totalClaims = sharesRes.data?.reduce((acc, share) => acc + (share.current_claims || 0), 0) || 0;

      setStats({
        totalBundles: bundlesRes.count || 0,
        bundleShares: sharesRes.count || 0,
        bundleClaims: totalClaims,
        activeConnections: connectionsRes.count || 0,
        totalBroadcasts: broadcastsRes.count || 0,
        eventsCreated: eventsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const bundleActivityData = [
    { name: 'Week 1', created: 4, shared: 8, claimed: 12 },
    { name: 'Week 2', created: 3, shared: 6, claimed: 9 },
    { name: 'Week 3', created: 5, shared: 10, claimed: 15 },
    { name: 'Week 4', created: 7, shared: 14, claimed: 21 },
  ];

  const resourceCategoryData = [
    { name: 'Housing', value: 35 },
    { name: 'Food', value: 25 },
    { name: 'Healthcare', value: 20 },
    { name: 'Employment', value: 12 },
    { name: 'Other', value: 8 },
  ];

  const connectionTrendData = [
    { name: 'Jan', connections: 12 },
    { name: 'Feb', connections: 19 },
    { name: 'Mar', connections: 25 },
    { name: 'Apr', connections: 32 },
    { name: 'May', connections: 38 },
    { name: 'Jun', connections: 45 },
  ];

  if (userLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Analytics & Insights</h1>
                <p className="text-muted-foreground">
                  Track resource usage, client outcomes, and service patterns
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Bundles</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalBundles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Bundle Shares</span>
              </div>
              <p className="text-2xl font-bold">{stats.bundleShares}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Total Claims</span>
              </div>
              <p className="text-2xl font-bold">{stats.bundleClaims}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Connections</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeConnections}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-muted-foreground">Broadcasts</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalBroadcasts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-muted-foreground">Events</span>
              </div>
              <p className="text-2xl font-bold">{stats.eventsCreated}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Bundle Activity</TabsTrigger>
            <TabsTrigger value="resources">Resource Categories</TabsTrigger>
            <TabsTrigger value="connections">Connection Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Bundle Activity Over Time</CardTitle>
                <CardDescription>
                  Track how bundles are being created, shared, and claimed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bundleActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="created" fill="#0088FE" name="Created" />
                      <Bar dataKey="shared" fill="#00C49F" name="Shared" />
                      <Bar dataKey="claimed" fill="#FFBB28" name="Claimed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resource Categories Distribution</CardTitle>
                <CardDescription>
                  Most commonly bundled resource categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={resourceCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Community Connections Growth</CardTitle>
                <CardDescription>
                  Track how community members are connecting with your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={connectionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="connections"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Active Connections"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
