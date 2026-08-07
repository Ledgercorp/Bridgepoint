import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BundleShareDialog } from "@/components/professional/BundleShareDialog";
import { DemoModeBanner } from "@/components/professional/DemoModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { demoBundles } from "@/utils/demoData";
import { Loader2, FolderKanban, Plus, Trash2, Share2, AlertTriangle } from "lucide-react";
import { useUserMode } from "@/hooks/useUserMode";

interface ResourceBundle {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  resources: Array<{
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    hours?: string;
  }>;
  created_at: string;
}

export default function ResourceBundles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile, currentMode, isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();

  const [bundles, setBundles] = useState<ResourceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === 'true');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<ResourceBundle | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Admin override - allow super admins to bypass verification
  const hasAccess = isSuperAdmin || (currentMode === 'professional' && isProfessionalVerified);

  useEffect(() => {
    if (!userLoading && !hasAccess) {
      navigate('/');
      return;
    }

    // Check for demo mode
    if (profile?.preferences && typeof profile.preferences === 'object') {
      const prefs = profile.preferences as { demoMode?: boolean };
      setDemoMode(prefs.demoMode || false);
    }

    loadBundles();
  }, [hasAccess, userLoading, navigate, profile]);

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_bundles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
      toast({
        title: "Error",
        description: "Failed to load resource bundles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBundle = async () => {
    if (demoMode) {
      toast({
        title: "Demo Mode",
        description: "Bundle creation is disabled in demo mode"
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your resource bundle",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('resource_bundles')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          notes: notes.trim() || null,
          resources: []
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource bundle created"
      });

      setTitle("");
      setDescription("");
      setNotes("");
      setDialogOpen(false);
      loadBundles();
    } catch (error) {
      console.error('Error creating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to create resource bundle",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteBundle = async (id: string) => {
    if (demoMode) {
      toast({
        title: "Demo Mode",
        description: "Bundle deletion is disabled in demo mode"
      });
      return;
    }

    if (!confirm("Delete this resource bundle?")) return;

    try {
      const { error } = await supabase
        .from('resource_bundles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Resource bundle removed"
      });

      loadBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive"
      });
    }
  };

  const handleExitDemo = async () => {
    try {
      const currentPrefs = profile?.preferences || {};
      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferences: {
            ...currentPrefs,
            demoMode: false
          }
        })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      setDemoMode(false);
      navigate('/professional-dashboard');
    } catch (error) {
      console.error('Error exiting demo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to exit demo mode"
      });
    }
  };

  // Use demo data if in demo mode
  const displayBundles = demoMode ? demoBundles : bundles;

  const handleShare = (bundle: ResourceBundle) => {
    setSelectedBundle(bundle);
    setShareDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      {demoMode && (
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <DemoModeBanner onExitDemo={handleExitDemo} />
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resource Bundles</h1>
            <p className="text-muted-foreground">
              Create shareable resource kits for your clients
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Bundle
          </Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Privacy Notice:</strong> Do not include client names, phone numbers, or any personally identifiable information in resource bundles. These are for general resource information only.
          </div>
        </div>

        {displayBundles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resource bundles yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first bundle to organize resources for your clients
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Bundle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayBundles.map((bundle) => (
              <Card key={bundle.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{bundle.title}</CardTitle>
                      {bundle.description && (
                        <CardDescription className="mt-2">{bundle.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBundle(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      {bundle.resources.length} resource{bundle.resources.length !== 1 ? 's' : ''}
                    </p>
                    {bundle.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Notes: {bundle.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(bundle)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Bundle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Resource Bundle</DialogTitle>
            <DialogDescription>
              Build a shareable collection of resources (no client data)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Bundle Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Housing Resources - Downtown Area"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this bundle"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                placeholder="General information (no client details)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={createBundle}
              disabled={creating || !title.trim()}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Bundle"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedBundle && (
        <BundleShareDialog
          open={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setSelectedBundle(null);
          }}
          bundleId={selectedBundle.id}
          bundleTitle={selectedBundle.title}
          bundleDescription={selectedBundle.description}
          bundleResources={selectedBundle.resources}
          bundleNotes={selectedBundle.notes}
        />
      )}
    </div>
  );
}
