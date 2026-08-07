import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserGreeting } from "@/components/UserGreeting";
import { ChatPanel } from "@/components/ChatPanel";
import { LocationSetup } from "@/components/LocationSetup";
import { useUserMode } from "@/hooks/useUserMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InstructorOnboarding } from "@/components/onboarding/InstructorOnboarding";
import {
  BookOpen,
  GraduationCap,
  FileText,
  MessageSquare,
  Users,
  Lightbulb,
  Shield,
  BookMarked,
  ClipboardList,
  Sparkles,
  Target
} from "lucide-react";
import { MODE_DEFINITIONS, getSolaceGreeting } from "@/config/modeDefinitions";

export default function InstructorHome() {
  const navigate = useNavigate();
  const { profile, loading, currentMode, isInstructorVerified, hasCompletedOnboarding, completeOnboarding, isAdmin, updateMode, updateProfile, refreshProfile } = useUserMode();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  // Ensure mode is set to instructor when on this page
  useEffect(() => {
    if (!loading && profile && currentMode !== "instructor") {
      updateMode("instructor");
    }
  }, [loading, profile, currentMode, updateMode]);

  // Check if user needs to see onboarding
  useEffect(() => {
    if (!loading && profile && !hasCompletedOnboarding && currentMode === "instructor") {
      setShowOnboarding(true);
    }
  }, [loading, profile, hasCompletedOnboarding, currentMode]);

  // Redirect if not instructor (admins can bypass)
  useEffect(() => {
    if (!loading && !isAdmin && (!isInstructorVerified || currentMode !== "instructor")) {
      navigate("/community-home");
    }
  }, [loading, isInstructorVerified, currentMode, navigate, isAdmin]);

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const primaryTools = [
    {
      icon: Sparkles,
      title: "Assignment Creator",
      description: "AI-powered assignment generator",
      action: () => navigate("/assignment-creator"),
      gradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600"
    },
    {
      icon: Lightbulb,
      title: "Curriculum Integration",
      description: "Assignment ideas & course planning",
      action: () => navigate("/instructor-guide"),
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600"
    },
    {
      icon: BookOpen,
      title: "Mini-Lessons Library",
      description: "Browse educational scenarios",
      action: () => navigate("/mini-lessons"),
      gradient: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-blue-600"
    },
    {
      icon: MessageSquare,
      title: "Try Solace AI",
      description: "Experience student guidance system",
      action: () => setIsChatOpen(true),
      gradient: "from-cyan-500/10 to-teal-500/10",
      iconColor: "text-cyan-600"
    },
  ];

  const explorationTools = [
    {
      icon: Users,
      title: "Study Rooms",
      description: "Collaborative learning spaces",
      action: () => navigate("/study-rooms"),
    },
    {
      icon: FileText,
      title: "Resource Kits",
      description: "Curated educational materials",
      action: () => navigate("/my-hub"),
    },
    {
      icon: BookMarked,
      title: "Life Navigation",
      description: "Real-world skill guides",
      action: () => navigate("/life-tasks-library"),
    },
    {
      icon: ClipboardList,
      title: "Quick Tasks",
      description: "Bite-sized learning activities",
      action: () => navigate("/quick-tasks"),
    },
  ];

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            <InstructorOnboarding onComplete={handleOnboardingComplete} />
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen bg-gradient-to-br from-background via-purple-500/5 to-background">
        <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => {}} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section with Greeting */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-purple-500/20">
                <GraduationCap className="w-4 h-4" />
                {MODE_DEFINITIONS.instructor.name}
              </div>
              <UserGreeting profile={profile} onChangeLocation={() => setShowLocationSetup(true)} />
              <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-2xl mx-auto">
                {getSolaceGreeting("instructor")}
              </p>
            </div>

            {/* Welcome Banner */}
            <Card className="border-2 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-indigo-500/10 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Welcome to Instructor Mode
                    </h2>
                    <p className="text-muted-foreground mb-3">
                      Explore student-facing features and discover how to integrate BridgePoint into your curriculum. All student data remains private—this is a preview-only environment.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 dark:text-purple-300 font-medium">Privacy Protected • Preview Only</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Primary Tools */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Explore Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {primaryTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card
                    key={tool.title}
                    className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 bg-gradient-to-br ${tool.gradient}`}
                    onClick={tool.action}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3">
                        <div className="p-3 bg-background/80 rounded-xl w-fit">
                          <Icon className={`h-7 w-7 ${tool.iconColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base mb-1">{tool.title}</CardTitle>
                          <CardDescription className="text-xs">{tool.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Additional Features */}
          <section className="mb-8">
            <Card className="border-2 bg-gradient-to-br from-background to-purple-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Additional Student Features</CardTitle>
                    <CardDescription>Explore more tools available to students</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {explorationTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Button
                        key={tool.title}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-purple-500/10 transition-all"
                        onClick={tool.action}
                      >
                        <Icon className="h-5 w-5 text-purple-600" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">{tool.title}</div>
                          <div className="text-xs text-muted-foreground">{tool.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Educational Context */}
          <section className="grid md:grid-cols-2 gap-4">
            <Card className="border-2 bg-gradient-to-br from-background to-blue-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BookMarked className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Learning Objectives</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Navigate community resources independently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Develop critical thinking for real-world scenarios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Build practical life management skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Collaborate effectively in study groups</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-background to-purple-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle>Privacy & Boundaries</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">No student data access</strong> - Complete privacy protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Preview mode only</strong> - Generic demonstration content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Educational purposes</strong> - Understand features for teaching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">✓</span>
                    <span><strong className="text-foreground">Curriculum planning</strong> - Design effective assignments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </main>

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentMode="instructor"
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
      </div>
    </>
  );
}