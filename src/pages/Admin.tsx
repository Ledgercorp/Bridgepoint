import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, XCircle, Loader2, Eye, Key, Building2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FlaggedResource {
  id: string;
  name: string;
  category: string;
  phone: string;
  website: string | null;
  report_count: number;
  last_reported_at: string;
  last_checked_at: string | null;
  last_check_status: string | null;
}

interface Report {
  id: string;
  reason: string;
  comment: string | null;
  created_at: string;
}

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [flaggedResources, setFlaggedResources] = useState<FlaggedResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<FlaggedResource | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin permissions.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadFlaggedResources();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const loadFlaggedResources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("id, name, category, phone, website, report_count, last_reported_at, last_checked_at, last_check_status")
        .eq("needs_review", true)
        .order("report_count", { ascending: false });

      if (error) throw error;
      setFlaggedResources(data || []);
    } catch (error) {
      console.error("Error loading flagged resources:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load flagged resources.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewReports = async (resource: FlaggedResource) => {
    setSelectedResource(resource);
    setIsDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from("resource_reports")
        .select("*")
        .eq("resource_id", resource.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports.",
      });
    }
  };

  const markAsResolved = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({
          needs_review: false,
          report_count: 0,
        })
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Resource Resolved",
        description: "The resource has been marked as verified.",
      });

      loadFlaggedResources();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error resolving resource:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resolve resource.",
      });
    }
  };

  const deactivateResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({
          is_active: false,
          needs_review: false,
        })
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Resource Deactivated",
        description: "The resource has been removed from public listings.",
      });

      loadFlaggedResources();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error deactivating resource:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate resource.",
      });
    }
  };

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => navigate("/")} />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage resources, access codes, and professional requests</p>
        </div>

        {/* Admin Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/instructor-codes')}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Key className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Instructor Codes</h3>
              </div>
              <p className="text-sm text-muted-foreground">Generate and manage instructor access codes</p>
            </div>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/professional-requests')}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Professional Requests</h3>
              </div>
              <p className="text-sm text-muted-foreground">Review and approve professional mode requests</p>
            </div>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/org-verifications')}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Org Verifications</h3>
              </div>
              <p className="text-sm text-muted-foreground">Review organization verification requests</p>
            </div>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold">Flagged Resources</h3>
              </div>
              <p className="text-sm text-muted-foreground">{flaggedResources.length} resources need review</p>
            </div>
          </Card>
        </div>

        {/* Flagged Resources Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Flagged Resources</h2>
        </div>

        {flaggedResources.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              All Clear!
            </h3>
            <p className="text-muted-foreground">
              No resources currently need review.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Last Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{resource.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{resource.report_count} reports</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(resource.last_reported_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {resource.last_check_status === "ok" ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Website OK
                        </span>
                      ) : resource.last_check_status === "failed" ? (
                        <span className="flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="w-4 h-4" />
                          Website Down
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not checked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReports(resource)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Resource Reports</DialogTitle>
            <DialogDescription>
              {selectedResource?.name} - {selectedResource?.category}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Phone:</p>
                  <p className="text-sm text-muted-foreground">{selectedResource?.phone}</p>
                </div>
                {selectedResource?.website && (
                  <div>
                    <p className="text-sm font-medium">Website:</p>
                    <a
                      href={selectedResource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Visit →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Reports ({reports.length})</h4>
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{report.reason.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    {report.comment && (
                      <p className="text-sm text-muted-foreground mt-2">{report.comment}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => selectedResource && deactivateResource(selectedResource.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deactivate Resource
            </Button>
            <Button
              variant="default"
              onClick={() => selectedResource && markAsResolved(selectedResource.id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;