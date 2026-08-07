import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { Check, X, Mail } from "lucide-react";
import { format } from "date-fns";

interface ProfessionalRequest {
  id: string;
  user_id: string;
  professional_email: string;
  professional_role: string;
  verified: boolean;
  created_at: string;
  verified_by_admin: boolean;
  user_profiles: {
    display_name: string | null;
    first_name: string | null;
    email: string;
  };
}

export default function AdminProfessionalRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserMode();
  const [requests, setRequests] = useState<ProfessionalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      loadRequests();
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_email_verifications')
        .select(`
          *,
          user_profiles!inner(display_name, first_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load professional requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string) => {
    setProcessing(requestId);
    try {
      // Update verification
      const { error: verifyError } = await supabase
        .from('professional_email_verifications')
        .update({
          verified: true,
          verified_by_admin: true
        })
        .eq('id', requestId);

      if (verifyError) throw verifyError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_professional_verified: true,
          current_mode: 'professional'
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Request Approved",
        description: "Professional mode access has been granted"
      });

      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('professional_email_verifications')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The professional access request has been rejected"
      });

      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'case_manager': 'Case Manager',
      'social_worker': 'Social Worker',
      'peer_support': 'Peer Support Specialist',
      'housing_navigator': 'Housing Navigator',
      'benefits_counselor': 'Benefits Counselor',
      'community_health': 'Community Health Worker',
      'other': 'Other Professional'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => !r.verified && !r.verified_by_admin);
  const processedRequests = requests.filter(r => r.verified || r.verified_by_admin);

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Professional Access Requests</h1>
          <p className="text-muted-foreground mt-2">Review and approve professional mode access requests</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
              <CardDescription>
                These requests are awaiting admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Account Email</TableHead>
                      <TableHead>Professional Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.user_profiles.display_name || request.user_profiles.first_name || "Unknown"}
                        </TableCell>
                        <TableCell>{request.user_profiles.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {request.professional_email}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleLabel(request.professional_role)}</TableCell>
                        <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id, request.user_id)}
                              disabled={processing === request.id}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              disabled={processing === request.id}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
              <CardDescription>
                Recently approved or rejected requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Professional Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.slice(0, 10).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.user_profiles.display_name || request.user_profiles.first_name || "Unknown"}
                        </TableCell>
                        <TableCell>{request.professional_email}</TableCell>
                        <TableCell>{getRoleLabel(request.professional_role)}</TableCell>
                        <TableCell>
                          {request.verified || request.verified_by_admin ? (
                            <Badge className="bg-green-600">Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
