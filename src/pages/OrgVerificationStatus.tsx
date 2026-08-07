import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle, XCircle, Clock, AlertCircle, ArrowRight,
  Shield, Calendar, User, Building2, Mail, FileText,
  RefreshCw, HelpCircle
} from "lucide-react";
import { format } from "date-fns";

interface VerificationRequest {
  id: string;
  organization_name: string;
  organization_email: string;
  organization_type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function OrgVerificationStatus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('organization_verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error loading status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!request) return 'gray';
    switch (request.status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'amber';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    if (!request) return <HelpCircle className="w-12 h-12 text-muted-foreground" />;
    switch (request.status) {
      case 'approved': return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'rejected': return <XCircle className="w-12 h-12 text-red-600" />;
      case 'pending': return <Clock className="w-12 h-12 text-amber-600" />;
      default: return <HelpCircle className="w-12 h-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Verification Status
          </h1>
          <p className="text-muted-foreground">
            Track your organization verification request
          </p>
        </div>

        {/* No Request Found */}
        {!request && (
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Verification Request Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You haven't submitted an organization verification request yet. Professional Mode is exclusively for verified organizations.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" onClick={() => navigate("/org-verification-guide")}>
                    Learn About Verification
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/professional-dashboard")}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        {request && (
          <div className="space-y-6">
            {/* Main Status */}
            <Card className={`border-2 border-${getStatusColor()}-500/20 bg-gradient-to-br from-${getStatusColor()}-500/5 to-${getStatusColor()}-500/10`}>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {getStatusIcon()}
                  </div>
                  <div>
                    <Badge
                      variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-lg px-4 py-1"
                    >
                      {request.status === 'approved' && 'Approved'}
                      {request.status === 'rejected' && 'Rejected'}
                      {request.status === 'pending' && 'Under Review'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{request.organization_name}</h3>
                    <p className="text-muted-foreground">
                      {request.status === 'approved' && 'Your organization has been verified! You can now access Professional Mode.'}
                      {request.status === 'rejected' && 'Your request was not approved. Please review the reason below and consider resubmitting.'}
                      {request.status === 'pending' && 'Your request is being reviewed by our team. We typically respond within 2-3 business days.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {request.status === 'rejected' && request.rejection_reason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-2">Reason for Rejection:</strong>
                  <p className="text-sm">{request.rejection_reason}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Organization</div>
                      <div className="text-sm text-muted-foreground">{request.organization_name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{request.organization_email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Type</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {request.organization_type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Submitted</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  {request.reviewed_at && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Reviewed</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.reviewed_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.status === 'pending' && (
                    <>
                      <p className="text-sm text-muted-foreground">While you wait:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Check your email regularly for updates</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Monitor your spam/junk folder</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Ensure your contact information is current</span>
                        </li>
                      </ul>
                    </>
                  )}

                  {request.status === 'approved' && (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">You're approved! Here's what to do next:</p>
                      <div className="space-y-2">
                        <Button className="w-full" onClick={() => navigate("/professional-dashboard")}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Complete Organization Setup
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => navigate("/org-verification-guide")}>
                          View Professional Features
                        </Button>
                      </div>
                    </>
                  )}

                  {request.status === 'rejected' && (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">If you believe this was an error:</p>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" onClick={() => navigate("/professional-dashboard")}>
                          Submit New Request
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => navigate("/org-verification-guide")}>
                          Review Requirements
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
