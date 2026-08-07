import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Folder, Trash2 } from "lucide-react";

interface ResourceKit {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function ResourceKits() {
  const [kits, setKits] = useState<ResourceKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kitName, setKitName] = useState("");
  const [kitDescription, setKitDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("resource_kits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKits(data || []);
    } catch (error) {
      console.error("Error loading kits:", error);
    } finally {
      setLoading(false);
    }
  };

  const createKit = async () => {
    if (!kitName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a kit name.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("resource_kits")
        .insert({
          user_id: user.id,
          name: kitName,
          description: kitDescription || null,
        });

      if (error) throw error;

      toast({
        title: "Kit Created",
        description: `"${kitName}" has been created.`,
      });

      setKitName("");
      setKitDescription("");
      setDialogOpen(false);
      loadKits();
    } catch (error) {
      console.error("Error creating kit:", error);
      toast({
        title: "Error",
        description: "Failed to create kit.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteKit = async (kitId: string, kitName: string) => {
    if (!confirm(`Delete "${kitName}"?`)) return;

    try {
      const { error } = await supabase
        .from("resource_kits")
        .delete()
        .eq("id", kitId);

      if (error) throw error;

      toast({
        title: "Kit Deleted",
        description: `"${kitName}" has been removed.`,
      });

      loadKits();
    } catch (error) {
      console.error("Error deleting kit:", error);
      toast({
        title: "Error",
        description: "Failed to delete kit.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading kits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resource Kits</h2>
          <p className="text-muted-foreground">Organize resources for learning and assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Kit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Resource Kit</DialogTitle>
              <DialogDescription>
                Build a collection of resources for your assignments or research
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="kit-name">Kit Name</Label>
                <Input
                  id="kit-name"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="e.g., Housing Resources Assignment"
                />
              </div>
              <div>
                <Label htmlFor="kit-description">Description (Optional)</Label>
                <Textarea
                  id="kit-description"
                  value={kitDescription}
                  onChange={(e) => setKitDescription(e.target.value)}
                  placeholder="What's this kit for?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createKit} disabled={creating}>
                {creating ? "Creating..." : "Create Kit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {kits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No resource kits yet</p>
            <p className="text-sm text-muted-foreground">Create your first kit to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Card key={kit.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Folder className="w-8 h-8 text-primary" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKit(kit.id, kit.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{kit.name}</CardTitle>
                {kit.description && (
                  <CardDescription>{kit.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}