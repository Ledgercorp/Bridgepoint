import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  ArrowLeft, Loader2, Zap, Trash2, Share2,
  Download, FolderKanban, CheckSquare, AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  resources: Json;
}

export default function BulkOperations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  useEffect(() => {
    if (hasAccess) {
      loadBundles();
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!userLoading && !loading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, userLoading, loading, navigate]);

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBundle = (id: string) => {
    const newSelected = new Set(selectedBundles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBundles(newSelected);
  };

  const selectAll = () => {
    if (selectedBundles.size === bundles.length) {
      setSelectedBundles(new Set());
    } else {
      setSelectedBundles(new Set(bundles.map(b => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('resource_bundles')
        .delete()
        .in('id', Array.from(selectedBundles));

      if (error) throw error;

      setBundles(bundles.filter(b => !selectedBundles.has(b.id)));
      setSelectedBundles(new Set());
      toast({
        title: "Bundles Deleted",
        description: `Successfully deleted ${selectedBundles.size} bundles`,
      });
    } catch (error) {
      console.error('Error deleting bundles:', error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete selected bundles",
      });
    } finally {
      setProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkExport = () => {
    const selectedData = bundles.filter(b => selectedBundles.has(b.id));
    const exportData = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bundles-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedBundles.size} bundles`,
    });
  };

  if (userLoading || loading) {
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bulk Operations</h1>
              <p className="text-muted-foreground">
                Perform mass actions on resources and bundles
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bundles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bundles">Resource Bundles</TabsTrigger>
            <TabsTrigger value="reports">Batch Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="bundles">
            {/* Action Bar */}
            {selectedBundles.size > 0 && (
              <Card className="mb-4 border-primary/50 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {selectedBundles.size} bundle{selectedBundles.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleBulkExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Resource Bundles</CardTitle>
                    <CardDescription>
                      Select bundles to perform bulk actions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {selectedBundles.size === bundles.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bundles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bundles found</p>
                    <Button
                      variant="link"
                      onClick={() => navigate('/resource-bundles?new=true')}
                      className="mt-2"
                    >
                      Create your first bundle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bundles.map((bundle) => (
                      <div
                        key={bundle.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          selectedBundles.has(bundle.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedBundles.has(bundle.id)}
                          onCheckedChange={() => toggleBundle(bundle.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{bundle.title}</h3>
                          {bundle.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {bundle.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {Array.isArray(bundle.resources) ? bundle.resources.length : 0} resources
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(bundle.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Batch Report Generation</CardTitle>
                <CardDescription>
                  Generate multiple reports at once
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Batch reporting coming soon</p>
                <p className="text-sm mt-1">Generate PDF reports for multiple bundles at once</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Bulk Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedBundles.size} bundle{selectedBundles.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
