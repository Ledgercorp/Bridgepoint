import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink, FileText, Download, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";
import jsPDF from "jspdf";

interface BundleResource {
  id?: string;
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
}

interface SharedBundle {
  id: string;
  bundle_id: string;
  shared_at: string;
  notes: string | null;
  bundle: {
    title: string;
    description: string | null;
    resources: Json;
    user_id: string;
  };
}

interface SharedResourceBundlesViewerProps {
  organizationId: string;
}

export const SharedResourceBundlesViewer = ({ organizationId }: SharedResourceBundlesViewerProps) => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState<SharedBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSharedBundles();
  }, [organizationId]);

  const loadSharedBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_bundle_access')
        .select(`
          id,
          bundle_id,
          shared_at,
          notes,
          bundle:resource_bundles!inner (
            title,
            description,
            resources,
            user_id
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        bundle_id: item.bundle_id,
        shared_at: item.shared_at,
        notes: item.notes,
        bundle: Array.isArray(item.bundle) ? item.bundle[0] : item.bundle
      })).filter(item => item.bundle); // Filter out any items without a bundle

      setBundles(transformedData as SharedBundle[]);
    } catch (error) {
      console.error('Error loading shared bundles:', error);
      toast({
        title: "Error",
        description: "Could not load shared resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (bundle: SharedBundle) => {
    const doc = new jsPDF();
    const resources = (Array.isArray(bundle.bundle.resources) ? bundle.bundle.resources : []) as BundleResource[];

    // Title
    doc.setFontSize(18);
    doc.text(bundle.bundle.title, 20, 20);

    // Description
    if (bundle.bundle.description) {
      doc.setFontSize(12);
      doc.text(bundle.bundle.description, 20, 30);
    }

    // Resources
    let yPos = 45;
    doc.setFontSize(14);
    doc.text('Resources:', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    resources.forEach((resource, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${index + 1}. ${resource.name || 'Resource'}`, 25, yPos);
      yPos += 6;

      if (resource.description) {
        const lines = doc.splitTextToSize(resource.description, 160);
        doc.text(lines, 30, yPos);
        yPos += lines.length * 5;
      }

      if (resource.phone) {
        doc.text(`   Phone: ${resource.phone}`, 30, yPos);
        yPos += 5;
      }

      if (resource.address) {
        doc.text(`   Address: ${resource.address}`, 30, yPos);
        yPos += 5;
      }

      yPos += 5;
    });

    doc.save(`${bundle.bundle.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);

    toast({
      title: "PDF Downloaded",
      description: "Resource bundle exported successfully",
    });
  };

  const saveToHub = async (bundleId: string, bundleTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a collection for this bundle
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: `${bundleTitle} (from organization)`,
          description: 'Saved from shared organization resources',
          icon: 'package',
          color: '#3b82f6',
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Get the bundle resources
      const { data: bundleData, error: bundleError } = await supabase
        .from('resource_bundles')
        .select('resources')
        .eq('id', bundleId)
        .single();

      if (bundleError) throw bundleError;

      const resources = (Array.isArray(bundleData.resources) ? bundleData.resources : []) as BundleResource[];

      // Add each resource to the collection
      const collectionItems = resources.map((resource) => ({
        collection_id: collection.id,
        item_id: resource.id || crypto.randomUUID(),
        item_type: 'resource',
      }));

      if (collectionItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('collection_items')
          .insert(collectionItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Saved to Hub",
        description: "Bundle saved to your collections",
      });

      navigate('/my-hub');
    } catch (error) {
      console.error('Error saving to hub:', error);
      toast({
        title: "Error",
        description: "Could not save bundle to hub",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading shared resources...</div>
        </CardContent>
      </Card>
    );
  }

  if (bundles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shared Resource Bundles
          </CardTitle>
          <CardDescription>Curated resources from your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No resource bundles shared yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Shared Resource Bundles
        </CardTitle>
        <CardDescription>Curated resources specially selected for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bundles.map((sharedBundle) => {
          const resources = Array.isArray(sharedBundle.bundle.resources)
            ? sharedBundle.bundle.resources
            : [];

          return (
            <div
              key={sharedBundle.id}
              className="p-4 border-2 rounded-lg bg-gradient-to-br from-background to-green-500/5 space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{sharedBundle.bundle.title}</h3>
                    {sharedBundle.bundle.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {sharedBundle.bundle.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {resources.length} Resources
                  </Badge>
                </div>

                {sharedBundle.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Note from your organization:</div>
                    <div className="text-sm">{sharedBundle.notes}</div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Shared {new Date(sharedBundle.shared_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => saveToHub(sharedBundle.bundle_id, sharedBundle.bundle.title)}
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Save to My Hub
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToPDF(sharedBundle)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // Show resources in a modal or navigate to resources
                    toast({
                      title: sharedBundle.bundle.title,
                      description: `${resources.length} resources included in this bundle`,
                    });
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
