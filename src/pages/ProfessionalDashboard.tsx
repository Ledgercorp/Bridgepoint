import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { OrganizationOnboarding } from "@/components/professional/OrganizationOnboarding";
import { OrganizationAdminPanel } from "@/components/professional/OrganizationAdminPanel";
import { OrgVerificationRequest } from "@/components/professional/OrgVerificationRequest";
import { ProfessionalOnboardingTour } from "@/components/professional/ProfessionalOnboardingTour";
import { DemoModeBanner } from "@/components/professional/DemoModeBanner";
import { DemoModeToggle } from "@/components/professional/DemoModeToggle";
import { DemoModeTour } from "@/components/professional/DemoModeTour";
import { SubscriptionRequiredBanner } from "@/components/professional/SubscriptionRequiredBanner";
import { NavigationBridgeManager } from "@/components/professional/NavigationBridgeManager";
import { WorkflowGenerator } from "@/components/professional/WorkflowGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { demoOrganization, adminPreviewOrganization, demoStats, adminPreviewStats, isDemoMode } from "@/utils/demoData";
import {
  Crown, Shield, BarChart3, FileText, Share2, Zap,
  Brain, Download, Lock, CheckCircle2, AlertCircle, Clock,
  TrendingUp, Users, Settings, MessageSquare, Sparkles, Building2, Wand2, ArrowRight,
  type LucideIcon,
} from "lucide-react";

type VerificationRequest = Database['public']['Tables']['organization_verification_requests']['Row'];

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isProfessionalVerified, currentMode, updateMode, isAdmin: isSuperAdmin, loading: userModeLoading } = useUserMode();
  const {
    hasSubscription,
    organizationName,
    subscriptionStatus,
    subscriptionEnd,
    loading: subscriptionLoading,
    isAdmin: isOrgAdmin
  } = useOrganizationSubscription();
  const { organization, loading: orgLoading, isAdmin } = useOrganization();
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVerificationRequest, setShowVerificationRequest] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [showDemoTour, setShowDemoTour] = useState(false);

  // Check for demo mode preference - but super admins see admin preview instead
  useEffect(() => {
    if (profile?.preferences && typeof profile.preferences === 'object') {
      const prefs = profile.preferences as { demoMode?: boolean };
      // Don't activate demo mode for super admins - they get admin preview instead
      if (!isSuperAdmin) {
        setDemoModeActive(prefs.demoMode || false);
      } else {
        setDemoModeActive(false);
      }
    }
  }, [profile, isSuperAdmin]);

  // Check if organization setup is needed and load verification request status
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (!orgLoading && !organization && currentMode === "professional" && user && !demoModeActive) {
        // Check if user has a verification request
        const { data } = await supabase
          .from('organization_verification_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setVerificationRequest(data);
          if (data.status === 'approved') {
            setShowOnboarding(true);
          } else if (data.status === 'pending') {
            setShowVerificationRequest(false);
          } else {
            setShowVerificationRequest(true);
          }
        } else {
          setShowVerificationRequest(true);
        }
      }
    };

    loadVerificationStatus();
  }, [orgLoading, organization, currentMode, user, demoModeActive]);

  // Admin override - treat super admin as having subscription
  const effectiveHasSubscription = hasSubscription || isSuperAdmin;

  // Debug logging
  console.log("ProfessionalDashboard Debug:", {
    hasSubscription,
    isSuperAdmin,
    effectiveHasSubscription,
    currentMode,
    orgLoading,
    subscriptionLoading
  });

  // Redirect if not in professional mode or subscription inactive
  useEffect(() => {
    if (!orgLoading && !subscriptionLoading && !userModeLoading) {
      if (currentMode !== "professional") {
        navigate("/professional-home");
      } else if (!effectiveHasSubscription && subscriptionStatus !== 'no_organization' && !demoModeActive) {
        // User is in professional mode but subscription is inactive
        // Revert to community mode
        console.log("Subscription inactive, reverting to community mode");
        updateMode("community");
        toast({
          title: "Subscription Required",
          description: "Your organization's subscription has lapsed. Please contact your administrator.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [currentMode, effectiveHasSubscription, subscriptionStatus, orgLoading, subscriptionLoading, userModeLoading, demoModeActive, navigate, updateMode, toast]);

  // Show loading state
  if (orgLoading || subscriptionLoading || userModeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleStartDemo = async () => {
    if (!user) return;

    try {
      const currentPrefs = profile?.preferences || {};
      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferences: {
            ...currentPrefs,
            demoMode: true
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setDemoModeActive(true);
      setShowDemoTour(true); // Trigger tour when demo starts
      toast({
        title: "Demo Mode Activated",
        description: "Exploring Professional Mode with sample data"
      });
    } catch (error) {
      console.error('Error starting demo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate demo mode"
      });
    }
  };

  const handleExitDemo = async () => {
    if (!user) return;

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
        .eq('user_id', user.id);

      if (error) throw error;

      setDemoModeActive(false);
      toast({
        title: "Demo Mode Exited",
        description: "Returning to normal view"
      });
    } catch (error) {
      console.error('Error exiting demo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to exit demo mode"
      });
    }
  };

  // Super admins bypass verification screens and see full dashboard with demo data
  const adminPreviewMode = isSuperAdmin && !organization;

  // Show verification request form if needed (not for super admins)
  if (showVerificationRequest && !organization && !demoModeActive && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Professional Mode Access</h1>
            <p className="text-muted-foreground">
              Submit your organization for verification to unlock Professional Mode
            </p>
          </div>

          <div className="mb-6">
            <DemoModeToggle onStartDemo={handleStartDemo} />
          </div>

          <OrgVerificationRequest onSuccess={() => setShowVerificationRequest(false)} />
        </div>
      </div>
    );
  }

  // Show pending verification status (not for super admins)
  if (verificationRequest && verificationRequest.status === 'pending' && !organization && !demoModeActive && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <strong>Verification Pending</strong>
              <p className="mt-2">
                Your organization verification request is under review. We'll notify you via email once it's been processed.
                This typically takes 2-3 business days.
              </p>
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <DemoModeToggle onStartDemo={handleStartDemo} />
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding if organization approved but not set up yet (not for super admins)
  if (showOnboarding && !isSuperAdmin) {
    return <OrganizationOnboarding onComplete={() => {
      setShowOnboarding(false);
      window.location.reload();
    }} />;
  }

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('organization-customer-portal');

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

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-organization-checkout');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Complete your organization subscription to unlock all Professional Mode features",
        });
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
      });
    }
  };

  const premiumFeatures: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    status: string;
    tag?: string;
    href?: string;
    action?: () => void;
    comingSoon?: boolean;
  }> = [
    {
      icon: Wand2,
      title: "Intelligent Workflow Generator",
      description: "AI-powered tool that generates detailed step-by-step workflows, scripts, and documentation requirements for staff",
      status: effectiveHasSubscription ? "active" : "locked",
      tag: "AI-Powered",
      href: "/workflow-generator"
    },
    {
      icon: Brain,
      title: "AI System Navigator",
      description: "Advanced AI that understands complex eligibility requirements and guides clients through multi-step processes",
      status: effectiveHasSubscription ? "active" : "locked",
      tag: "Most Popular",
      href: "/system-navigator"
    },
    {
      icon: FileText,
      title: "Smart Case Documentation",
      description: "Generate comprehensive case summaries, resource recommendations, and action plans with one click",
      status: effectiveHasSubscription ? "active" : "locked",
      tag: "Time Saver",
      href: "/case-documentation"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track resource usage patterns, client outcomes, and identify service gaps in your area",
      status: effectiveHasSubscription ? "active" : "locked",
      tag: "Data-Driven",
      href: "/analytics-dashboard"
    },
    {
      icon: Share2,
      title: "Advanced Resource Bundles",
      description: "Create unlimited custom bundles, share with colleagues, and export to PDF with branding",
      status: effectiveHasSubscription ? "active" : "locked",
      href: "/resource-bundles"
    },
    {
      icon: Users,
      title: "Client Journey Tracking",
      description: "Anonymous case tracking system to monitor progress and outcomes without storing PII",
      status: effectiveHasSubscription ? "active" : "locked",
      href: "/client-journey-tracking"
    },
    {
      icon: Zap,
      title: "Bulk Operations",
      description: "Update multiple resources, generate batch reports, and perform mass actions efficiently",
      status: effectiveHasSubscription ? "active" : "locked",
      href: "/bulk-operations"
    },
    {
      icon: Download,
      title: "Advanced Export Tools",
      description: "Export data to Excel, PDF, or custom formats with professional templates and branding",
      status: effectiveHasSubscription ? "active" : "locked",
      href: "/export-tools"
    },
  ];

  const quickActions: Array<{
    icon: LucideIcon;
    label: string;
    description: string;
    href: string;
    premium: boolean;
    adminOnly?: boolean;
  }> = [
    {
      icon: Brain,
      label: "AI Navigator",
      description: "Start guided navigation",
      href: "/system-navigator",
      premium: true
    },
    {
      icon: FileText,
      label: "Resource Bundles",
      description: "Manage your bundles",
      href: "/resource-bundles",
      premium: false
    },
    {
      icon: Settings,
      label: "Organization",
      description: "Team & settings",
      href: "/organization-management",
      premium: false,
      adminOnly: true,
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "View insights",
      href: "/analytics",
      premium: true
    },
    {
      icon: Share2,
      label: "Professional Tools",
      description: "Access all tools",
      href: "/professional-tools",
      premium: false
    },
  ];

  // Use demo data if in demo mode OR if super admin is previewing without an organization
  const displayOrg = demoModeActive ? demoOrganization : (adminPreviewMode ? adminPreviewOrganization : organization);
  const displayIsAdmin = (demoModeActive || adminPreviewMode) ? true : isAdmin;
  const displayStats = demoModeActive ? demoStats : (adminPreviewMode ? adminPreviewStats : { bundlesCreatedThisMonth: 12, bundlesLastMonth: 8 });

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      {/* Demo Mode Banner - only for non-admins */}
      {demoModeActive && !isSuperAdmin && (
        <div className="container max-w-7xl py-4 px-4">
          <DemoModeBanner onExitDemo={handleExitDemo} />
        </div>
      )}

      {/* Subscription Required Banner */}
      {!effectiveHasSubscription && !demoModeActive && (
        <div className="container max-w-7xl py-4 px-4">
          <SubscriptionRequiredBanner
            organizationName={organizationName || "Your organization"}
            isAdmin={isOrgAdmin}
            subscriptionStatus={subscriptionStatus}
          />
        </div>
      )}

      {/* Onboarding Tour - skip for admin preview */}
      {displayOrg && displayIsAdmin && !demoModeActive && !adminPreviewMode && (
        <ProfessionalOnboardingTour
          organizationId={displayOrg.id}
          isAdmin={displayIsAdmin}
        />
      )}

      {/* Demo Mode Tour */}
      <DemoModeTour
        isActive={showDemoTour}
        onComplete={() => setShowDemoTour(false)}
      />

      <div className="container max-w-7xl py-8 px-4 space-y-6">
        {/* Verification Required Banner */}
        {!displayOrg && !demoModeActive && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>Professional Mode Access Requirements</strong>
              <p className="mt-2">
                Professional Mode is exclusively for verified nonprofit organizations, community agencies, shelters, and outreach teams.
                Individual users cannot access this mode. To unlock Professional Mode:
              </p>
              <ul className="mt-2 ml-4 space-y-1 text-sm">
                <li>• Submit organization verification request</li>
                <li>• Wait for BridgePoint admin approval (2-3 business days)</li>
                <li>• Complete organization setup</li>
                <li>• Maintain active paid subscription</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" />
              Professional Dashboard
            </h1>
            {displayOrg && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{displayOrg.name}</span>
                {displayIsAdmin && (
                  <Badge variant="outline" className="ml-2">
                    Admin
                  </Badge>
                )}
              </div>
            )}
            <p className="text-muted-foreground mt-1">
              Organization tools for verified nonprofits, shelters, and community agencies
            </p>
          </div>
          <Button onClick={() => navigate("/profile")} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4" data-demo-tour="org-stats">
          {/* Subscription Status */}
          <Card
            data-tour="subscription-card"
            className={effectiveHasSubscription ? "border-amber-500/50 bg-gradient-to-br from-background to-amber-500/5" : ""}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className={`w-4 h-4 ${effectiveHasSubscription ? "text-amber-500" : "text-muted-foreground"}`} />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {effectiveHasSubscription ? (
                    <>
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                        {isSuperAdmin && !hasSubscription ? "Admin Override" : "Active"}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline">{subscriptionStatus || 'Inactive'}</Badge>
                  )}
                </div>
                {effectiveHasSubscription && subscriptionEnd && !isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Renews {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
                {isOrgAdmin && !isSuperAdmin && (
                  <Button
                    size="sm"
                    variant={effectiveHasSubscription ? "outline" : "default"}
                    className={effectiveHasSubscription ? "" : "w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"}
                    onClick={effectiveHasSubscription ? handleManageSubscription : handleUpgrade}
                    disabled={isManagingSubscription}
                  >
                    {effectiveHasSubscription ? "Manage" : "Subscribe Now"}
                  </Button>
                )}
                {!isOrgAdmin && !effectiveHasSubscription && (
                  <p className="text-xs text-muted-foreground">
                    Contact your admin to subscribe
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isProfessionalVerified ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified Professional</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your professional status is confirmed
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Pending Verification</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Check your email for verification link
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{displayStats.bundlesCreatedThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Resource bundles created
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{displayStats.bundlesCreatedThisMonth - displayStats.bundlesLastMonth} from last month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Admin Panel */}
        {displayIsAdmin && (
          <div data-demo-tour="team-members">
            <OrganizationAdminPanel demoMode={demoModeActive} adminPreviewMode={adminPreviewMode} />
          </div>
        )}

        {/* Community Navigation Bridge - only for real organizations */}
        {displayOrg && displayIsAdmin && !demoModeActive && !adminPreviewMode && (
          <NavigationBridgeManager
            organizationId={displayOrg.id}
            organizationName={displayOrg.name}
          />
        )}

        {/* Workflow Generator */}
        {(displayOrg || isSuperAdmin) && !demoModeActive && (
          <div data-tour="workflow-generator">
            <WorkflowGenerator />
          </div>
        )}

        {/* Quick Actions */}
        <Card data-demo-tour="demo-toggle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Access your most-used tools and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions
                .filter(action => !action.adminOnly || isAdmin)
                .map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start text-left relative"
                  data-tour={action.label === "Resource Bundles" ? "recent-bundles" : undefined}
                  onClick={() => {
                    if (action.premium && !effectiveHasSubscription) {
                      toast({
                        title: "Premium Feature",
                        description: "Upgrade to access this feature",
                        variant: "destructive",
                      });
                      return;
                    }
                    navigate(action.href);
                  }}
                >
                  {action.premium && !effectiveHasSubscription && (
                    <Lock className="w-3 h-3 absolute top-2 right-2 text-muted-foreground" />
                  )}
                  <action.icon className="w-5 h-5 mb-2" />
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card data-tour="premium-features">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Premium Features
            </CardTitle>
            <CardDescription>
              {effectiveHasSubscription
                ? "Your active premium features and tools"
                : "Unlock these powerful features with a premium subscription"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumFeatures.map((feature) => {
                const handleFeatureClick = () => {
                  console.log("Feature clicked:", feature.title, {
                    status: feature.status,
                    href: feature.href,
                    action: !!feature.action,
                    comingSoon: feature.comingSoon,
                    effectiveHasSubscription,
                    isSuperAdmin
                  });

                  // For admins, always allow access (bypass status check)
                  const isUnlocked = feature.status === "active" || isSuperAdmin;

                  if (!isUnlocked) {
                    toast({
                      title: "Premium Feature",
                      description: "Upgrade to premium to access this feature",
                    });
                    return;
                  }
                  if (feature.comingSoon) {
                    toast({
                      title: "Coming Soon",
                      description: "This feature is currently in development",
                    });
                    return;
                  }
                  if (feature.action) {
                    feature.action();
                  } else if (feature.href) {
                    console.log("Navigating to:", feature.href);
                    navigate(feature.href);
                  }
                };

                return (
                  <button
                    key={feature.title}
                    onClick={handleFeatureClick}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      feature.status === "active"
                        ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 cursor-pointer"
                        : "border-border bg-muted/30 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        feature.status === "active"
                          ? "bg-amber-500/20"
                          : "bg-muted"
                      }`}>
                        <feature.icon className={`w-5 h-5 ${
                          feature.status === "active"
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{feature.title}</h3>
                          {feature.tag && (
                            <Badge variant="secondary" className="text-xs">
                              {feature.tag}
                            </Badge>
                          )}
                          {feature.comingSoon && feature.status === "active" && (
                            <Badge variant="outline" className="text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    {feature.status === "locked" && (
                      <div className="flex items-center gap-2 text-amber-600 text-xs mt-2">
                        <Lock className="w-3 h-3" />
                        <span className="font-medium">Premium Only</span>
                      </div>
                    )}
                    {feature.status === "active" && !feature.comingSoon && (
                      <div className="flex items-center gap-2 text-amber-600 text-xs mt-2">
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">Access Feature</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!effectiveHasSubscription && (
              <div className="mt-6 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Ready to unlock all features?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Join thousands of professionals using BridgePoint Premium
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={handleUpgrade}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium - $99.00/mo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your recent actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Your activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
