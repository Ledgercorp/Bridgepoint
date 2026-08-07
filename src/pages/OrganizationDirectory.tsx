import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationConnection } from "@/hooks/useOrganizationConnection";
import { QRScanner } from "@/components/QRScanner";
import { Building2, Link as LinkIcon, QrCode, AlertCircle } from "lucide-react";

export default function OrganizationDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, organizationName, connectToOrganization } = useOrganizationConnection();

  const [connectionCode, setConnectionCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleConnect = async (code?: string) => {
    const codeToUse = code || connectionCode;

    if (!codeToUse.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter a connection code",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-organization', {
        body: { code: codeToUse }
      });

      if (error) throw error;

      if (data.found) {
        await connectToOrganization(data.organizationId, codeToUse);
        navigate("/community-home");
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
      setConnectionCode("");
    }
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    setConnectionCode(scannedCode.toUpperCase());
    handleConnect(scannedCode);
  };

  if (isConnected) {
    navigate("/community-home");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Connect to Your Organization</h1>
          <p className="text-muted-foreground text-lg">
            Enter your organization's connection code to access their support hub
          </p>
        </div>

        {/* Connection Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Organization Connection
            </CardTitle>
            <CardDescription>
              Your organization will provide you with a unique connection code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Code</label>
              <div className="flex gap-2">
                <Input
                  placeholder="BRIDGE-XXXXXX"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
                <Button
                  onClick={() => handleConnect()}
                  disabled={!connectionCode || isConnecting}
                  size="lg"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Format: BRIDGE-XXXXXX (e.g., BRIDGE-ABC123)
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <AlertCircle className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Step 1:</strong> Get your connection code from your organization (shelter, food bank, community center, etc.)
            </p>
            <p>
              <strong className="text-foreground">Step 2:</strong> Enter the code above or scan their QR code
            </p>
            <p>
              <strong className="text-foreground">Step 3:</strong> Access your organization's support hub, events, programs, and resources
            </p>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have a connection code?
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate("/community-home")}>
                  Continue Without Organization
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can still access community resources and support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <QRScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
