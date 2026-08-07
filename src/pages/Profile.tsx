import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { User, GraduationCap, Calendar, Shield, LogOut, Trash2, Crown, ShieldCheck, AlertTriangle } from "lucide-react";
import { ResourceKits } from "@/components/student/ResourceKits";
import { LearningNotes } from "@/components/student/LearningNotes";
import { WeeklySummary } from "@/components/student/WeeklySummary";
import { StudentBadges } from "@/components/student/StudentBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentVerificationDialog as UpgradeToStudentDialog } from "@/components/UpgradeToStudentDialog";

import { InstructorCodeInput } from "@/components/professional/InstructorCodeInput";
import { ModeSwitcher } from "@/components/ModeSwitcher";

const SUPER_ADMIN_EMAIL = "cweiss2@dtcc.edu";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isEduVerified, isProfessionalVerified, isInstructorVerified, isAdmin, currentMode, updateMode, loading } = useUserMode();
  const { subscribed, subscription_end, loading: subscriptionLoading } = useSubscription();

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [adminToggling, setAdminToggling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = profile?.email === SUPER_ADMIN_EMAIL;

  const handleToggleAdmin = async () => {
    if (!user || !isSuperAdmin) return;

    setAdminToggling(true);
    try {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'admin');

        if (error) throw error;
        toast({
          title: "Admin Mode Disabled",
          description: "You are now in regular user mode.",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });

        if (error) throw error;
        toast({
          title: "Admin Mode Enabled",
          description: "You now have full admin access.",
        });
      }
      // Refresh the page to update the admin state
      window.location.reload();
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: "Error",
        description: "Failed to toggle admin mode.",
        variant: "destructive",
      });
    } finally {
      setAdminToggling(false);
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
      return;
    }

    if (profile) {
      setDisplayName(profile.display_name || "");
    }
  }, [user, profile, loading, navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: displayName || null })
      .eq('user_id', user?.id);

    if (!error) {
      toast({
        title: "Profile Updated",
        description: "Your display name has been saved.",
      });
      setIsEditing(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete user profile first (cascading deletes should handle related data)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user?.id);

      if (profileError) {
        console.error("Profile deletion error:", profileError);
        // Continue anyway - the auth deletion is what matters
      }

      // Sign out first to clear session
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });

      // Navigate to auth page
      navigate("/auth");
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Error",
        description: "There was an issue deleting your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open subscription portal",
      });
    } finally {
      setIsManagingSubscription(false);
    }
  };


  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container max-w-4xl py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Your account information and activity
          </p>
        </div>

        {/* User Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Account Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input value={profile.email} disabled />
                {isEduVerified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    .edu verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={displayName || "Not set"}
                    disabled
                  />
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Current Mode</Label>
              <div className="flex items-center gap-2">
                <ModeSwitcher
                  currentMode={currentMode}
                  isEduVerified={isEduVerified}
                  isProfessionalVerified={isProfessionalVerified}
                  isInstructorVerified={isInstructorVerified}
                  isAdmin={isAdmin}
                  onModeChange={updateMode}
                  variant="button"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isEduVerified || isProfessionalVerified
                  ? "Switch between available modes at any time"
                  : "Verify your .edu email to unlock Student Mode"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </Label>
              <p className="text-sm text-muted-foreground">
                Active community member
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Super Admin Switch - Only visible to cweiss2@dtcc.edu */}
        {isSuperAdmin && (
          <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <CardTitle>Developer Admin Access</CardTitle>
              </div>
              <CardDescription>
                Toggle admin privileges for testing locked features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="admin-switch" className="font-medium">Admin Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Bypasses subscription checks and unlocks all features
                  </p>
                </div>
                <Switch
                  id="admin-switch"
                  checked={isAdmin}
                  onCheckedChange={handleToggleAdmin}
                  disabled={adminToggling}
                />
              </div>
              {isAdmin && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Admin mode active.</strong> You have access to all modes and features.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Student Mode Features */}
        {isEduVerified && currentMode === "student" && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <CardTitle>Student Features</CardTitle>
                </div>
                <CardDescription>
                  Educational tools available with your .edu account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="kits" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="kits">Resource Kits</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                  </TabsList>
                  <TabsContent value="kits" className="mt-4">
                    <ResourceKits />
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <LearningNotes />
                  </TabsContent>
                  <TabsContent value="summary" className="mt-4">
                    <WeeklySummary />
                  </TabsContent>
                  <TabsContent value="badges" className="mt-4">
                    <StudentBadges />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Educational Use Only:</strong> Student features are for learning and coursework.
                Never enter client-identifying information in notes or kits.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Professional Mode - Organization Only */}
        {currentMode === "professional" && (
          <Card className="border-2 bg-gradient-to-br from-background to-muted/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Professional Mode</CardTitle>
                  <CardDescription>
                    Organization-level access managed by your administrator
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription>
                  Professional Mode is organization-based and requires membership in a verified nonprofit organization with an active subscription. Individual users cannot access Professional Mode independently.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Contact your organization administrator to manage subscription and access.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructor Mode Access - Only when in instructor mode */}
        {!isInstructorVerified && currentMode === "instructor" && (
          <InstructorCodeInput
            onSuccess={() => {
              toast({
                title: "Instructor Mode Activated!",
                description: "You can now preview student features"
              });
              window.location.reload();
            }}
          />
        )}

        {/* Community Mode Lists */}
        {(!isEduVerified || currentMode === "community") && (
          <Card>
            <CardHeader>
              <CardTitle>My Lists</CardTitle>
              <CardDescription>
                Save and organize resources you find helpful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Lists feature coming soon
              </p>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>Privacy & Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              BridgePoint does not store client or personal identifying information.
              All resource information is general and non-clinical.
            </p>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        <Button onClick={() => navigate("/")} variant="outline" className="w-full">
          Back to Home
        </Button>
      </div>

      <UpgradeToStudentDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action is <strong>permanent and cannot be undone</strong>. All of your data will be deleted, including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Your profile and preferences</li>
                <li>Saved resources and collections</li>
                <li>Reminders and notes</li>
                <li>Any organization connections</li>
              </ul>
              <p className="font-medium">
                Are you absolutely sure you want to delete your account?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
