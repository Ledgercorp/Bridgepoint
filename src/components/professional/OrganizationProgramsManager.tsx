import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface OrganizationProgram {
  id: string;
  name: string;
  description: string;
  eligibility: string | null;
  contact_info: string | null;
  hours: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface OrganizationProgramsManagerProps {
  organizationId: string;
}

export const OrganizationProgramsManager = ({ organizationId }: OrganizationProgramsManagerProps) => {
  const [programs, setPrograms] = useState<OrganizationProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eligibility: "",
    contact_info: "",
    hours: "",
    is_active: true,
  });

  useEffect(() => {
    loadPrograms();
  }, [organizationId]);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_programs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error("Error loading programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const maxOrder = programs.length > 0
        ? Math.max(...programs.map(p => p.display_order))
        : -1;

      const { error } = await supabase.from("organization_programs").insert({
        organization_id: organizationId,
        name: formData.name,
        description: formData.description,
        eligibility: formData.eligibility || null,
        contact_info: formData.contact_info || null,
        hours: formData.hours || null,
        is_active: formData.is_active,
        display_order: maxOrder + 1,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Program created successfully",
      });

      setFormData({
        name: "",
        description: "",
        eligibility: "",
        contact_info: "",
        hours: "",
        is_active: true,
      });
      setShowForm(false);
      loadPrograms();
    } catch (error) {
      console.error("Error creating program:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const { error } = await supabase
        .from("organization_programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      loadPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete program",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (programId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("organization_programs")
        .update({ is_active: !currentStatus })
        .eq("id", programId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Program ${!currentStatus ? "activated" : "deactivated"}`,
      });
      loadPrograms();
    } catch (error) {
      console.error("Error toggling program:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading programs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programs Management</h2>
          <p className="text-muted-foreground">Create and manage programs for your community</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Program</CardTitle>
            <CardDescription>Fill in the details for your program</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="eligibility">Eligibility Requirements</Label>
                <Textarea
                  id="eligibility"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  rows={2}
                  placeholder="Who can participate in this program?"
                />
              </div>

              <div>
                <Label htmlFor="hours">Operating Hours</Label>
                <Input
                  id="hours"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="e.g., Mon-Fri 9am-5pm"
                />
              </div>

              <div>
                <Label htmlFor="contact_info">Contact Information</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="Phone, email, or contact person"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Program (visible to community)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Program</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No programs yet. Create your first program above.
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className={!program.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {program.name}
                        {!program.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                        )}
                      </CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(program.id, program.is_active)}
                    >
                      {program.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {program.eligibility && (
                  <div>
                    <span className="font-medium text-sm">Eligibility: </span>
                    <span className="text-sm text-muted-foreground">{program.eligibility}</span>
                  </div>
                )}
                {program.hours && (
                  <div>
                    <span className="font-medium text-sm">Hours: </span>
                    <span className="text-sm text-muted-foreground">{program.hours}</span>
                  </div>
                )}
                {program.contact_info && (
                  <div>
                    <span className="font-medium text-sm">Contact: </span>
                    <span className="text-sm text-muted-foreground">{program.contact_info}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
