import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserGreeting } from "@/components/UserGreeting";
import { LocationSetup } from "@/components/LocationSetup";
import { ChatPanel } from "@/components/ChatPanel";
import { useUserMode } from "@/hooks/useUserMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommunityOnboarding } from "@/components/onboarding/CommunityOnboarding";
import { CommunityTour } from "@/components/onboarding/CommunityTour";
import { OrganizationConnection } from "@/components/community/OrganizationConnection";
import { MyOrganization } from "@/components/community/MyOrganization";
import { useOrganizationConnection } from "@/hooks/useOrganizationConnection";
import {
  MessageSquare,
  MapPin,
  Heart,
  Zap,
  BookOpen,
  HelpCircle,
  FileText,
  Phone,
  DollarSign,
  Home,
  UtensilsCrossed,
  Scale,
  Car,
  Users,
  HeartHandshake,
  Sparkles,
  Shield,
  Target,
  FolderOpen,
  LifeBuoy,
  TrendingUp
} from "lucide-react";
import solaceAvatar from "@/assets/solace-avatar.png";
import { MODE_DEFINITIONS, getSolaceGreeting } from "@/config/modeDefinitions";

export default function CommunityHome() {
  const navigate = useNavigate();
  const {
    profile,
    loading,
    updateProfile,
    refreshProfile,
    currentMode,
    isEduVerified,
    hasCompletedOnboarding,
    completeOnboarding,
    updateMode
  } = useUserMode();
  const { isConnected, organizationId, organizationName, loading: connectionLoading } = useOrganizationConnection();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Ensure mode is set to community when on this page
  useEffect(() => {
    if (!loading && profile && currentMode !== "community") {
      updateMode("community");
    }
  }, [loading, profile, currentMode, updateMode]);

  // Check if user needs to see onboarding
  useEffect(() => {
    if (!loading && profile && !hasCompletedOnboarding && currentMode === "community") {
      setShowOnboarding(true);
    }
  }, [loading, profile, hasCompletedOnboarding, currentMode]);

  // Redirect student mode users to the student home page
  useEffect(() => {
    if (!loading && currentMode === "student" && isEduVerified) {
      navigate("/student-home");
    }
  }, [loading, currentMode, isEduVerified, navigate]);

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
    // Start the interactive tour after onboarding slides
    setTimeout(() => setShowTour(true), 500);
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          role="status"
          aria-label="Loading BridgePoint"
        />
      </div>
    );
  }

  const handleLocationSet = async (location: string, locationType: 'zip' | 'city_state') => {
    const success = await updateProfile({
      home_location: location,
      home_location_type: locationType,
    });

    if (success) {
      setShowLocationSetup(false);
      refreshProfile();
    }
  };

  const quickActions = [
    {
      icon: MessageSquare,
      label: "Talk to Solace",
      description: "Get instant support and guidance",
      action: () => setIsChatOpen(true),
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600",
      tourId: "talk-to-solace"
    },
    {
      icon: MapPin,
      label: "Find Resources",
      description: "Search local support services",
      action: () => navigate("/resources?search=true"),
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-600",
      tourId: "find-resources"
    },
    {
      icon: Zap,
      label: "Quick Tasks",
      description: "Instant help for common needs",
      action: () => navigate('/quick-tasks'),
      gradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600",
      tourId: "quick-tasks"
    },
    {
      icon: BookOpen,
      label: "Life Navigation",
      description: "Step-by-step task guides",
      action: () => navigate('/life-tasks-library'),
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600",
      tourId: "life-navigation"
    },
  ];

  const supportTools = [
    { icon: Phone, label: "Phone Companion", description: "Call prep assistance", path: "/phone-companion" },
    { icon: FileText, label: "Form Helper", description: "Form guidance", path: "/form-helper" },
    { icon: FolderOpen, label: "Document Safe Box", description: "Store important files", path: "/document-safe-box" },
    { icon: Heart, label: "Healthcare Help", description: "Medicaid & clinics", path: "/healthcare-help" },
    { icon: HelpCircle, label: "I'm Overwhelmed", description: "Take a breath", path: "/im-overwhelmed" },
    { icon: DollarSign, label: "Cost of Living", description: "Local expense info", path: "/cost-of-living" }
  ];

  const resourceCategories = [
    { icon: Home, label: "Housing", color: "hover:bg-blue-500/10" },
    { icon: UtensilsCrossed, label: "Food", color: "hover:bg-orange-500/10" },
    { icon: Scale, label: "Legal Aid", color: "hover:bg-purple-500/10" },
    { icon: Car, label: "Transportation", color: "hover:bg-indigo-500/10" },
    { icon: HeartHandshake, label: "DV Support", color: "hover:bg-rose-500/10" },
    { icon: Users, label: "Youth Programs", color: "hover:bg-teal-500/10" },
    { icon: Phone, label: "Hotlines", color: "hover:bg-red-500/10" },
    { icon: DollarSign, label: "Financial Help", color: "hover:bg-green-500/10" }
  ];

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            <CommunityOnboarding onComplete={handleOnboardingComplete} />
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => navigate("/resources?search=true")} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section with Greeting */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-green-500/20">
                <HeartHandshake className="w-4 h-4" />
                {MODE_DEFINITIONS.community.name}
              </div>
              <UserGreeting
                profile={profile}
                onChangeLocation={() => setShowLocationSetup(true)}
              />
              <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-2xl mx-auto">
                {getSolaceGreeting("community")}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-2 bg-gradient-to-br from-background to-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Support Ready</p>
                      <p className="text-2xl font-bold mt-1">24/7</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <LifeBuoy className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-background to-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Resources</p>
                      <p className="text-2xl font-bold mt-1">Saved</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-background to-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-2xl font-bold mt-1">Growing</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Organization Section */}
          <section className="mb-8" data-tour="organization-section">
            {isConnected && organizationId && organizationName ? (
              <MyOrganization
                organizationId={organizationId}
                organizationName={organizationName}
              />
            ) : (
              <OrganizationConnection />
            )}
          </section>

          {/* Quick Actions */}
          <section className="mb-8" data-tour="quick-actions">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.label}
                    data-tour={action.tourId}
                    className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 bg-gradient-to-br ${action.gradient}`}
                    onClick={action.action}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3">
                        <div className={`p-3 bg-background/80 rounded-xl w-fit`}>
                          <Icon className={`h-7 w-7 ${action.iconColor}`} />
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

          {/* Support Tools */}
          <section className="mb-8" data-tour="support-tools">
            <Card className="border-2 bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personal Support Tools</CardTitle>
                    <CardDescription>Additional help for everyday challenges</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Button
                        key={tool.label}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-primary/10 transition-all"
                        onClick={() => navigate(tool.path)}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="text-center">
                          <div className="text-xs font-medium">{tool.label}</div>
                          <div className="text-xs text-muted-foreground">{tool.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Resource Categories */}
          <section className="mb-8" data-tour="resource-categories">
            <Card className="border-2 bg-gradient-to-br from-background to-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Browse Resources by Category</CardTitle>
                    <CardDescription>Find local support in your area</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {resourceCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Button
                        key={category.label}
                        variant="outline"
                        className={`h-auto py-4 flex flex-col items-center gap-2 border-2 transition-all duration-200 ${category.color}`}
                        onClick={() => navigate(`/resources?category=${category.label}`)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center">{category.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* My Hub Section */}
          <section data-tour="my-hub">
            <Card className="border-2 bg-gradient-to-br from-background to-blue-500/5">
              <CardHeader>
                <CardTitle>Your Personal Space</CardTitle>
                <CardDescription>Access your saved items and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto h-auto py-4 justify-start gap-3 border-2 hover:bg-blue-500/10 transition-all"
                  onClick={() => navigate('/my-hub')}
                >
                  <Heart className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">My Hub</div>
                    <div className="text-xs text-muted-foreground">Collections, notes & saved resources</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Important Notice */}
          <section className="mt-8">
            <Card className="border-2 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle>Important to Know</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Resource information only</strong> - No clinical advice, diagnosis, or treatment</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Privacy protected</strong> - No personal or health information is collected</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Verify details</strong> - Always confirm with service providers before visiting</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentMode="community"
          isEduVerified={false}
          userLocation={profile?.home_location || null}
          userFirstName={profile?.first_name || null}
        />

        {/* Location Setup Dialog */}
        <Dialog open={showLocationSetup} onOpenChange={setShowLocationSetup}>
          <DialogContent className="sm:max-w-md">
            <LocationSetup
              onLocationSet={handleLocationSet}
              initialLocation={profile?.home_location}
              showAsDialog={true}
            />
          </DialogContent>
        </Dialog>

        {/* Interactive Tour */}
        {showTour && <CommunityTour onComplete={handleTourComplete} />}
      </div>
    </>
  );
}
