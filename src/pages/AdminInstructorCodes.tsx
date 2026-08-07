import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { Plus, Copy, Check, Ban, BarChart } from "lucide-react";
import { format } from "date-fns";

interface InstructorCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  description: string | null;
}

export default function AdminInstructorCodes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useUserMode();
  const [codes, setCodes] = useState<InstructorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCodeDescription, setNewCodeDescription] = useState("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState("");
  const [newCodeExpiryDays, setNewCodeExpiryDays] = useState("30");
  const [creating, setCreating] = useState(false);

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

      loadCodes();
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error loading codes:', error);
      toast({
        title: "Error",
        description: "Failed to load instructor codes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    // Generate a readable code: 3 groups of 4 uppercase letters/numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    const groups = [];
    for (let i = 0; i < 3; i++) {
      let group = '';
      for (let j = 0; j < 4; j++) {
        group += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      groups.push(group);
    }
    return groups.join('-');
  };

  const handleCreateCode = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      const expiresAt = newCodeExpiryDays
        ? new Date(Date.now() + parseInt(newCodeExpiryDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;
      const maxUses = newCodeMaxUses ? parseInt(newCodeMaxUses) : null;

      const { error } = await supabase
        .from('instructor_access_codes')
        .insert({
          code,
          created_by: user?.id,
          expires_at: expiresAt,
          max_uses: maxUses,
          description: newCodeDescription || null
        });

      if (error) throw error;

      toast({
        title: "Code Created",
        description: `Instructor code ${code} created successfully`
      });

      setNewCodeDescription("");
      setNewCodeMaxUses("");
      setNewCodeExpiryDays("30");
      setCreateDialogOpen(false);
      loadCodes();
    } catch (error) {
      console.error('Error creating code:', error);
      toast({
        title: "Error",
        description: "Failed to create instructor code",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied",
      description: "Code copied to clipboard"
    });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('instructor_access_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Code Deactivated" : "Code Activated",
        description: `Code has been ${currentStatus ? 'deactivated' : 'activated'}`
      });

      loadCodes();
    } catch (error) {
      console.error('Error toggling code:', error);
      toast({
        title: "Error",
        description: "Failed to update code status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructor Access Codes</h1>
            <p className="text-muted-foreground mt-2">Generate and manage codes for instructor preview access</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Generate New Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Instructor Access Code</DialogTitle>
                <DialogDescription>
                  Create a new code for instructors to preview student features
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Spring 2024 Faculty"
                    value={newCodeDescription}
                    onChange={(e) => setNewCodeDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDays">Expires In (Days)</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    placeholder="30"
                    value={newCodeExpiryDays}
                    onChange={(e) => setNewCodeExpiryDays(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateCode}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? "Generating..." : "Generate Code"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Codes</CardTitle>
            <CardDescription>
              Instructors can use these codes to access preview mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No codes created yet. Generate your first code above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => {
                    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                    const isMaxedOut = code.max_uses && code.current_uses >= code.max_uses;

                    return (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            {code.code}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code.code)}
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{code.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                            {code.current_uses} {code.max_uses ? `/ ${code.max_uses}` : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.expires_at ? (
                            <span className={isExpired ? "text-red-600" : ""}>
                              {format(new Date(code.expires_at), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>
                          {!code.is_active ? (
                            <Badge variant="secondary">Inactive</Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isMaxedOut ? (
                            <Badge variant="secondary">Max Uses</Badge>
                          ) : (
                            <Badge className="bg-green-600">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(code.id, code.is_active)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
