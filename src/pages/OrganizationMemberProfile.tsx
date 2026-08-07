import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ArrowLeft, User, Mail, Calendar, Activity, MessageSquare, Link as LinkIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type OrganizationConnection = Database['public']['Tables']['organization_connections']['Row'];

interface MemberData {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  user_profiles: {
    display_name: string | null;
    email: string;
    first_name: string | null;
  };
}

interface ActivityPoint {
  date: string;
  connections: number;
}

interface ThreadSummary {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

interface ThreadActivity {
  total: number;
  recent: ThreadSummary[];
}

export default function OrganizationMemberProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [connections, setConnections] = useState<OrganizationConnection[]>([]);
  const [threadActivity, setThreadActivity] = useState<ThreadActivity>({ total: 0, recent: [] });

  const memberId = searchParams.get('memberId');
  const orgId = searchParams.get('orgId');

  useEffect(() => {
    if (memberId && orgId) {
      loadMemberProfile();
    }
  }, [memberId, orgId]);

  const loadMemberProfile = async () => {
    try {
      // Load member details
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          user_profiles!inner(display_name, email, first_name)
        `)
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .single();

      if (memberError) throw memberError;

      // Load connection history
      const { data: connectionData, error: connError } = await supabase
        .from('organization_connections')
        .select('*')
        .eq('user_id', member.user_id)
        .eq('organization_id', orgId)
        .order('connected_at', { ascending: false });

      if (connError) throw connError;

      // Load thread activity
      const { data: threads, error: threadsError } = await supabase
        .from('support_threads')
        .select(`
          id,
          subject,
          status,
          created_at,
          thread_messages(count)
        `)
        .eq('community_user_id', member.user_id)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (threadsError) throw threadsError;

      // Calculate activity data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: format(date, 'MMM dd'),
          connections: 0,
        };
      });

      // Count connections per day
      connectionData?.forEach((conn) => {
        const connDate = format(new Date(conn.connected_at), 'MMM dd');
        const dayIndex = last7Days.findIndex(d => d.date === connDate);
        if (dayIndex !== -1) {
          last7Days[dayIndex].connections++;
        }
      });

      setMemberData(member as MemberData);
      setConnections(connectionData || []);
      setThreadActivity({
        total: threads?.length || 0,
        recent: threads || [],
      });
      setActivityData(last7Days);
    } catch (error) {
      console.error('Error loading member profile:', error);
      toast({
        title: "Error",
        description: "Failed to load member profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Member not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeConnections = connections.filter((connection) => connection.is_active).length;
  const lastActive = connections.length > 0
    ? connections[0].last_active || connections[0].connected_at
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {memberData.user_profiles.display_name || memberData.user_profiles.first_name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {memberData.user_profiles.email}
              </p>
            </div>
          </div>
          <Badge variant={memberData.role === 'admin' ? 'default' : 'secondary'}>
            {memberData.role}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{connections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-semibold">{activeConnections}</span>
                </div>
                {lastActive && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Last active: {format(new Date(lastActive), 'PPp')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Support Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Threads</span>
                  <span className="font-semibold">{threadActivity.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recent</span>
                  <span className="font-semibold">{threadActivity.recent.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="font-semibold text-sm">
                    {format(new Date(memberData.joined_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Days Active</span>
                  <span className="font-semibold">
                    {Math.floor((Date.now() - new Date(memberData.joined_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Connection Activity (Last 7 Days)
            </CardTitle>
            <CardDescription>Daily connection patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="connections"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {threadActivity.recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Support Threads</CardTitle>
              <CardDescription>Latest support interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threadActivity.recent.map((thread) => (
                  <div key={thread.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{thread.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(thread.created_at), 'PPp')}
                      </p>
                    </div>
                    <Badge variant={
                      thread.status === 'active' ? 'default' :
                      thread.status === 'closed' ? 'secondary' : 'outline'
                    }>
                      {thread.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Connection History</CardTitle>
            <CardDescription>All connection events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Connected via {conn.connection_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conn.connected_at), 'PPp')}
                    </p>
                  </div>
                  <Badge variant={conn.is_active ? 'default' : 'secondary'}>
                    {conn.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
              {connections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No connection history available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
