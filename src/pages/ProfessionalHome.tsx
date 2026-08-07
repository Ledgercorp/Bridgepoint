import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserGreeting } from "@/components/UserGreeting";
import { LocationSetup } from "@/components/LocationSetup";
import { ChatPanel } from "@/components/ChatPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfessionalOnboarding } from "@/components/onboarding/ProfessionalOnboarding";
import { FieldModeToggle } from "@/components/professional/FieldModeToggle";
import { OfflineIndicator } from "@/components/professional/OfflineIndicator";
import { ORESPanel } from "@/components/professional/ORESPanel";
import { WorkflowLibrary } from "@/components/professional/WorkflowLibrary";
import { TeamBoard } from "@/components/professional/TeamBoard";
import { useUserMode } from "@/hooks/useUserMode";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { useFieldMode } from "@/hooks/useFieldMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  FolderKanban,
  Star,
  Map,
  PackagePlus,
  Settings as SettingsIcon,
  CreditCard,
  Heart,
  UtensilsCrossed,
  Banknote,
  Bus,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  Crown,
  Lock,
  Building2,
  Send,
  Calendar,
  Bell,
  Link2,
  Home
} from "lucide-react";
import solaceAvatar from "@/assets/solace-avatar.png";
import { MODE_DEFINITIONS, getSolaceGreeting } from "@/config/modeDefinitions";

export default function ProfessionalHome() {
  const navigate = useNavigate();
  const { user, profile, loading, currentMode, isProfessionalVerified, hasCompletedOnboarding, completeOnboarding, isAdmin, updateMode } = useUserMode();
  const { hasSubscription, loading: subscriptionLoading } = useOrganizationSubscription();
  const { organization, isAdmin: isOrgAdmin } = useOrganization();
  const {
    isFieldModeEnabled,
    isOnline,
    isSyncing,
    lastSynced,
    hasPendingChanges,
    toggleFieldMode,
    forceSync,
  } = useFieldMode(user?.id || null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Ensure mode is set to professional when on this page
  useEffect(() => {
    if (!loading && profile && currentMode !== "professional") {
      updateMode("professional");
    }
  }, [loading, profile, currentMode, updateMode]);

  // Check if user needs to see onboarding
  useEffect(() => {
    if (!loading && profile && !hasCompletedOnboarding && currentMode === "professional") {
      setShowOnboarding(true);
    }
  }, [loading, profile, hasCompletedOnboarding, currentMode]);

  // Redirect if not professional (admins can bypass)
  useEffect(() => {
    if (!loading && !isAdmin && (!isProfessionalVerified || currentMode !== "professional")) {
      navigate("/community-home");
    }
  }, [loading, isProfessionalVerified, currentMode, navigate, isAdmin]);

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const organizationTools = [
    {
      icon: TrendingUp,
      label: "Analytics",
      description: "View organization insights",
      action: () => navigate('/organization-management?tab=analytics'),
      gradient: "from-violet-500/10 to-purple-500/10",
      iconColor: "text-violet-600"
    },
    {
      icon: Send,
      label: "Community Bridge",
      description: "Connect with community users",
      action: () => navigate('/support-threads'),
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600"
    },
    {
      icon: Bell,
      label: "Broadcasts",
      description: "Send announcements",
      action: () => navigate('/organization-management?tab=broadcasts'),
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600"
    },
    {
      icon: Calendar,
      label: "Events",
      description: "Manage events",
      action: () => navigate('/organization-management?tab=events'),
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600"
    },
    {
      icon: Users,
      label: "Members",
      description: "Manage team",
      action: () => navigate('/organization-management?tab=members'),
      gradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600",
      adminOnly: true
    },
  ];

  const quickActions = [
    {
      icon: MessageSquare,
      label: "Ask Solace",
      description: "Get instant guidance for client situations",
      action: () => setIsChatOpen(true),
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600"
    },
    {
      icon: FolderKanban,
      label: "Resource Bundles",
      description: "Create custom kits for your clients",
      action: () => navigate('/resource-bundles'),
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600"
    },
    {
      icon: PackagePlus,
      label: "Professional Tools",
      description: "Scripts, templates & prep guides",
      action: () => navigate('/professional-tools'),
      gradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600"
    },
    {
      icon: Map,
      label: "System Navigator",
      description: "AI-powered system navigation guide",
      action: () => navigate('/system-navigator'),
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600"
    },
  ];

  const clientShortcuts = [
    { icon: Home, label: "Housing", path: "/life-tasks-library?category=housing", color: "hover:bg-blue-500/10" },
    { icon: CreditCard, label: "ID & Documents", path: "/life-tasks-library?category=identification", color: "hover:bg-purple-500/10" },
    { icon: Heart, label: "Healthcare", path: "/healthcare-help", color: "hover:bg-rose-500/10" },
    { icon: UtensilsCrossed, label: "Food Support", path: "/life-tasks-library?category=food", color: "hover:bg-orange-500/10" },
    { icon: Banknote, label: "Benefits", path: "/life-tasks-library?category=benefits", color: "hover:bg-green-500/10" },
    { icon: Bus, label: "Transportation", path: "/life-tasks-library?category=transportation", color: "hover:bg-indigo-500/10" }
  ];

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            <ProfessionalOnboarding onComplete={handleOnboardingComplete} />
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => navigate('/resources')} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Subscription Lock Alert */}
          {!hasSubscription && (
            <Alert className="border-amber-500/50 bg-amber-500/10 mb-6">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                <strong>Organization Subscription Required</strong> - Professional Mode features are locked.
                Your organization needs an active paid subscription to access these tools.
                Please contact your administrator or visit the{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-amber-900 dark:text-amber-100 underline font-semibold"
                  onClick={() => navigate("/professional-dashboard")}
                >
                  Professional Dashboard
                </Button>
                {" "}to manage your subscription.
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Section with Greeting */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-blue-500/20">
                <Briefcase className="w-4 h-4" />
                {MODE_DEFINITIONS.professional.name}
              </div>
              <UserGreeting
                profile={profile}
                onChangeLocation={() => setShowLocationSetup(true)}
              />
              <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-2xl mx-auto">
                {getSolaceGreeting("professional")}
              </p>
            </div>
            <div className="flex justify-end">
              {hasSubscription && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                  Active Subscription
                </Badge>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-2 bg-gradient-to-br from-background to-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quick Access</p>
                      <p className="text-2xl font-bold mt-1">Ready</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-background to-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Organization Tools</p>
                      <p className="text-2xl font-bold mt-1">Active</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-background to-emerald-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Impact</p>
                      <p className="text-2xl font-bold mt-1">Growing</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Dashboard CTA */}
            <Card className="mb-8 border-2 border-amber-500/30 bg-gradient-to-br from-background to-amber-500/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Crown className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                        Professional Dashboard
                        {hasSubscription && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                            Active
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your organization's subscription and access premium features
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/professional-dashboard')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    Open Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Field Mode Toggle */}
            <div className="mb-4">
              <FieldModeToggle
                isEnabled={isFieldModeEnabled}
                isOnline={isOnline}
                isSyncing={isSyncing}
                lastSynced={lastSynced}
                hasPendingChanges={hasPendingChanges}
                onToggle={toggleFieldMode}
                onForceSync={forceSync}
                isLocked={!hasSubscription && !isAdmin}
              />
            </div>

            {/* ORES Panel - Real-time Resource Sync */}
            {organization && (
              <div className="mb-4">
                <ORESPanel
                  organizationId={organization.id}
                  organizationName={organization.name}
                  isAdmin={isOrgAdmin}
                />
              </div>
            )}

            {/* Workflow Library */}
            <div className="mb-4">
              <WorkflowLibrary
                userId={user?.id || null}
                organizationId={organization?.id || null}
                organizationName={organization?.name}
              />
            </div>

            {/* Team Board */}
            {organization && (
              <div className="mb-4">
                <TeamBoard
                  organizationId={organization.id}
                  userId={user?.id || null}
                  organizationName={organization.name}
                />
              </div>
            )}
          </div>

          {/* Organization Section */}
          {organization && (
            <section className="mb-8">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{organization.name}</CardTitle>
                        <CardDescription>Your Organization</CardDescription>
                      </div>
                    </div>
                    {isOrgAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/organization-management')}
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {organizationTools.map((tool) => {
                      if (tool.adminOnly && !isOrgAdmin) return null;
                      const Icon = tool.icon;
                      return (
                        <Card
                          key={tool.label}
                          className={`cursor-pointer hover:shadow-lg transition-all duration-300 border bg-gradient-to-br ${tool.gradient}`}
                          onClick={tool.action}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-2">
                              <div className={`p-2 bg-background/80 rounded-lg w-fit`}>
                                <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                              </div>
                              <div>
                                <CardTitle className="text-sm mb-1">{tool.label}</CardTitle>
                                <CardDescription className="text-xs">{tool.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.label}
                    className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 bg-gradient-to-br ${action.gradient}`}
                    onClick={() => action.action()}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 bg-background/80 rounded-xl w-fit`}>
                            <Icon className={`h-7 w-7 ${action.iconColor}`} />
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-base mb-1">{action.label}</CardTitle>
                          <CardDescription className="text-xs">{action.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Client Resource Shortcuts */}
          <section className="mb-8">
            <Card className="border-2 bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Client Resource Categories</CardTitle>
                    <CardDescription>Quick access to essential support areas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {clientShortcuts.map((shortcut) => {
                    const Icon = shortcut.icon;
                    const canAccess = hasSubscription || isAdmin;
                    return (
                      <Button
                        key={shortcut.label}
                        variant="outline"
                        className={`h-auto py-4 flex flex-col items-center gap-2 border-2 transition-all duration-200 ${shortcut.color}`}
                        onClick={() => {
                          if (!canAccess) {
                            navigate("/professional-dashboard");
                            return;
                          }
                          navigate(shortcut.path);
                        }}
                        disabled={!canAccess}
                      >
                        {!canAccess && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-600" />}
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center">{shortcut.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentMode="professional"
          isEduVerified={false}
          userLocation={profile?.home_location || null}
          userFirstName={profile?.first_name || null}
        />

        {/* Location Setup Dialog */}
        <Dialog open={showLocationSetup} onOpenChange={setShowLocationSetup}>
          <DialogContent className="sm:max-w-md">
            <LocationSetup
              onLocationSet={async () => setShowLocationSetup(false)}
              initialLocation={profile?.home_location}
              showAsDialog={true}
            />
          </DialogContent>
        </Dialog>

        {/* Offline Indicator */}
        <OfflineIndicator
          isFieldModeEnabled={isFieldModeEnabled}
          isOnline={isOnline}
          isSyncing={isSyncing}
          hasPendingChanges={hasPendingChanges}
        />
      </div>
    </>
  );
}
