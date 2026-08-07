import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, Package, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  resources: Json;
}

interface SharedAccess {
  id: string;
  bundle_id: string;
  shared_at: string;
  notes: string | null;
  is_active: boolean;
}

interface BundleShareToOrganizationProps {
  organizationId: string;
}

export const BundleShareToOrganization = ({ organizationId }: BundleShareToOrganizationProps) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's bundles
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('resource_bundles')
        .select('id, title, description, resources')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (bundlesError) throw bundlesError;

      // Load existing shared access
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_bundle_access')
        .select('*')
        .eq('organization_id', organizationId);

      if (sharedError) throw sharedError;

      setBundles(bundlesData || []);
      setSharedAccess(sharedData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Could not load bundles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedBundleId) return;

    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shared_bundle_access')
        .insert({
          bundle_id: selectedBundleId,
          organization_id: organizationId,
          shared_by: user.id,
          notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Bundle Shared",
        description: "Resource bundle is now available to your connected members",
      });

      setDialogOpen(false);
      setSelectedBundleId("");
      setNotes("");
      loadData();
    } catch (error) {
      console.error('Error sharing bundle:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate')
          ? "This bundle is already shared with your organization"
          : "Could not share bundle",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (accessId: string) => {
    try {
      const { error } = await supabase
        .from('shared_bundle_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: "Bundle Unshared",
        description: "Resource bundle removed from organization",
      });

      loadData();
    } catch (error) {
      console.error('Error unsharing bundle:', error);
      toast({
        title: "Error",
        description: "Could not unshare bundle",
        variant: "destructive",
      });
    }
  };

  const getSharedBundleInfo = (bundleId: string) => {
    return sharedAccess.find(sa => sa.bundle_id === bundleId);
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

  const sharedBundleIds = new Set(sharedAccess.map(sa => sa.bundle_id));
  const sharedBundles = bundles.filter(b => sharedBundleIds.has(b.id));
  const availableBundles = bundles.filter(b => !sharedBundleIds.has(b.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Resource Bundles
            </CardTitle>
            <CardDescription>
              Share curated resource bundles with your connected community members
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={availableBundles.length === 0}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Bundle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Resource Bundle</DialogTitle>
                <DialogDescription>
                  Select a bundle to share with your connected community members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Bundle</Label>
                  <Select value={selectedBundleId} onValueChange={setSelectedBundleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a bundle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBundles.map(bundle => (
                        <SelectItem key={bundle.id} value={bundle.id}>
                          {bundle.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes for Members (Optional)</Label>
                  <Textarea
                    placeholder="Add context or instructions for using these resources..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleShare}
                  disabled={!selectedBundleId || sharing}
                  className="w-full"
                >
                  {sharing ? "Sharing..." : "Share Bundle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sharedBundles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bundles shared yet. Create and share resource bundles to help your community.
          </div>
        ) : (
          <div className="space-y-3">
            {sharedBundles.map(bundle => {
              const accessInfo = getSharedBundleInfo(bundle.id);
              const resourceCount = Array.isArray(bundle.resources) ? bundle.resources.length : 0;

              return (
                <div
                  key={bundle.id}
                  className="p-4 border rounded-lg bg-gradient-to-br from-background to-green-500/5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{bundle.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {resourceCount}
                        </Badge>
                      </div>
                      {bundle.description && (
                        <p className="text-sm text-muted-foreground">{bundle.description}</p>
                      )}
                      {accessInfo?.notes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <span className="font-medium">Note: </span>
                          {accessInfo.notes}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Shared {accessInfo && new Date(accessInfo.shared_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => accessInfo && handleUnshare(accessInfo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
