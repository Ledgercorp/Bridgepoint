import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOrganizationConnection } from "@/hooks/useOrganizationConnection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, QrCode, Link2, Unlink, MessageSquare } from "lucide-react";
import QRCode from "qrcode";

export const OrganizationConnection = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    organizationName,
    connectionCode,
    loading,
    disconnectFromOrganization,
    organizationId,
    connectToOrganization
  } = useOrganizationConnection();

  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (connectionCode) {
      // Generate QR code
      QRCode.toDataURL(`${window.location.origin}/connect/${connectionCode}`)
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [connectionCode]);

  const handleDisconnect = async () => {
    if (organizationId) {
      await disconnectFromOrganization(organizationId);
    }
  };

  const handleConnect = async () => {
    if (!code) return;

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-organization', {
        body: { code }
      });

      if (error) throw error;

      if (data.found) {
        await connectToOrganization(data.organizationId);
      } else {
        toast({
          title: "Invalid Code",
          description: "Organization not found with this code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to organization",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Connected Organization
          </CardTitle>
          <CardDescription>
            You're connected to {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">{organizationName}</div>
              <div className="text-sm text-muted-foreground">Connection Code: {connectionCode}</div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>

          {qrUrl && (
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Your Connection QR Code</div>
              <img src={qrUrl} alt="Connection QR Code" className="mx-auto w-48 h-48" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => navigate('/support-threads')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Support Threads
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDisconnect}
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Connect to an Organization
        </CardTitle>
        <CardDescription>
          Get support from a verified community organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Enter Organization Code</div>
          <div className="flex gap-2">
            <Input
              placeholder="BRIDGE-ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <Button
              onClick={handleConnect}
              disabled={!code || isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          <QrCode className="w-4 h-4 mr-2" />
          Scan QR Code
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/browse-organizations')}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Browse Organizations
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Ask your organization for their connection code, scan their QR code, or browse available organizations
        </div>
      </CardContent>
    </Card>
  );
};
