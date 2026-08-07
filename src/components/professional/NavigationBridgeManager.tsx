import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupportThreads } from "@/hooks/useSupportThreads";
import {
  Link2, Users, MessageSquare, CheckCircle, Clock,
  AlertCircle, QrCode, RefreshCw
} from "lucide-react";
import QRCode from "qrcode";

interface BridgeConnection {
  id: string;
  user_id: string;
  connected_at: string;
  last_active: string | null;
  is_active: boolean;
  user_profiles: {
    display_name: string | null;
    first_name: string | null;
  } | null;
}

interface NavigationBridgeManagerProps {
  organizationId: string;
  organizationName: string;
}

export const NavigationBridgeManager = ({
  organizationId,
  organizationName
}: NavigationBridgeManagerProps) => {
  const { toast } = useToast();
  const { threads, loading: threadsLoading } = useSupportThreads(organizationId);
  const [connections, setConnections] = useState<BridgeConnection[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [connectionCode, setConnectionCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadBridgeData();
  }, [organizationId]);

  const loadBridgeData = async () => {
    try {
      // Generate organization connection code
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_org_connection_code',
        { org_id: organizationId }
      );

      if (codeError) throw codeError;
      setConnectionCode(codeData);

      // Generate QR code for the connection code itself
      const qr = await QRCode.toDataURL(codeData);
      setQrCode(qr);

      // Load active connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('organization_connections')
        .select(`
          id,
          user_id,
          connected_at,
          last_active,
          is_active,
          user_profiles:user_id (
            display_name,
            first_name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('connected_at', { ascending: false });

      if (connectionsError) throw connectionsError;
      setConnections((connectionsData || []) as BridgeConnection[]);

    } catch (error) {
      console.error('Error loading bridge data:', error);
      toast({
        title: "Error",
        description: "Failed to load Navigation Bridge data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateCode = async () => {
    setRegenerating(true);
    try {
      const { data: newCode, error } = await supabase.rpc(
        'regenerate_org_connection_code',
        { org_id: organizationId }
      );

      if (error) throw error;

      setConnectionCode(newCode);
      const qr = await QRCode.toDataURL(newCode);
      setQrCode(qr);

      toast({
        title: "Code Regenerated",
        description: "Your new connection code is ready. Previous codes will no longer work for new connections.",
      });
    } catch (error) {
      console.error('Error regenerating code:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate connection code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const openThreads = threads.filter(t => t.status === 'open').length;
  const closedThreads = threads.filter(t => t.status === 'closed').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Connected Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">
              Active connections to your organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Open Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openThreads}</div>
            <p className="text-xs text-muted-foreground">
              Support threads awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedThreads}</div>
            <p className="text-xs text-muted-foreground">
              Closed threads this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Community Connection Code</CardTitle>
          <CardDescription>
            Your organization's unique code (like "BRIDGE-ABC123") that community members use to connect. Share this code or QR code with people who need your support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="threads">Support Threads</TabsTrigger>
              <TabsTrigger value="users">Connected Users</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Organization Connection Code</h3>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-3xl font-mono font-bold mb-2">
                      {connectionCode}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this code with community members
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(connectionCode);
                        toast({ title: "Copied!", description: "Connection code copied to clipboard" });
                      }}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={regenerateCode}
                      disabled={regenerating}
                      title="Generate a new code (invalidates old code for new connections)"
                    >
                      <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Need a new code? Click the refresh button. Existing connections won't be affected.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">QR Code</h3>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    {qrCode && (
                      <img src={qrCode} alt="Organization Connection QR Code" className="w-48 h-48 mx-auto" />
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Scan to connect with code: {connectionCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${organizationName}-connection-qr.png`;
                      link.href = qrCode;
                      link.click();
                    }}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="threads" className="mt-4">
              {threadsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No support threads yet
                </div>
              ) : (
                <div className="space-y-3">
                  {threads.slice(0, 10).map((thread) => (
                    <div key={thread.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{thread.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(thread.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
                        {thread.status === 'open' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Closed
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No connected users yet
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => {
                    const profile = connection.user_profiles;
                    return (
                      <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {profile?.display_name || profile?.first_name || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Connected {new Date(connection.connected_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
