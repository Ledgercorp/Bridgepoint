import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Loader2, Building2, Shield, ArrowLeft, Home } from 'lucide-react';

interface AcceptedOrganization {
  name: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [organization, setOrganization] = useState<AcceptedOrganization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-org-invite', {
        body: { token },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setOrganization(data.organization);
      setAccepted(true);
      toast({
        title: "Invitation Accepted",
        description: data.message,
      });
    } catch (error) {
      console.error('Error accepting invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Home">
          <Home className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center">
      <Card className="max-w-md w-full">
        {!accepted && !error ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Organization Invitation</CardTitle>
                  <CardDescription>
                    You've been invited to join an organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  By accepting this invitation, you'll become a member of the organization and gain access to their tools and resources.
                </p>
              </div>
              <Button
                onClick={handleAccept}
                disabled={loading || !token}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </>
        ) : accepted && organization ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle>Welcome to {organization.name}!</CardTitle>
                  <CardDescription>
                    You've successfully joined the organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  You now have access to {organization.name}'s professional tools and can collaborate with team members.
                </p>
              </div>
              <Button
                onClick={() => navigate('/professional-dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        ) : error ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle>Invitation Error</CardTitle>
                  <CardDescription>
                    Unable to accept invitation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </CardContent>
          </>
        ) : null}
      </Card>
      </div>
    </div>
  );
}
