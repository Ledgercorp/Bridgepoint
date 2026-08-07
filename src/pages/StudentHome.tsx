import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserGreeting } from "@/components/UserGreeting";
import { ChatPanel } from "@/components/ChatPanel";
import { LocationSetup } from "@/components/LocationSetup";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StudentOnboarding } from "@/components/onboarding/StudentOnboarding";
import { useUserMode } from "@/hooks/useUserMode";
import { FeaturedLesson } from "@/components/student/FeaturedLesson";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { GraduationCap } from "lucide-react";
import { MODE_DEFINITIONS, getSolaceGreeting } from "@/config/modeDefinitions";

export default function StudentHome() {
  const navigate = useNavigate();
  const { profile, loading, currentMode, isEduVerified, hasCompletedOnboarding, completeOnboarding, updateMode, updateProfile, refreshProfile } = useUserMode();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  // Ensure mode is set to student
  useEffect(() => {
    if (!loading && profile && currentMode !== "student") {
      updateMode("student");
    }
  }, [loading, profile, currentMode, updateMode]);

  // Show onboarding if not completed
  useEffect(() => {
    if (!loading && profile && !hasCompletedOnboarding && currentMode === "student") {
      setShowOnboarding(true);
    }
  }, [loading, profile, hasCompletedOnboarding, currentMode]);

  // Redirect if not verified student
  useEffect(() => {
    if (!loading && (!isEduVerified || currentMode !== "student")) {
      navigate("/community-home");
    }
  }, [loading, isEduVerified, currentMode, navigate]);

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


  return (
    <>
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            <StudentOnboarding onComplete={handleOnboardingComplete} />
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-500/5">
        <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => {}} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-blue-500/20">
              <GraduationCap className="w-4 h-4" />
              {MODE_DEFINITIONS.student.name}
            </div>
            <UserGreeting profile={profile} onChangeLocation={() => setShowLocationSetup(true)} />
            <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-2xl mx-auto">
              {getSolaceGreeting("student")}
            </p>
          </div>

          {/* Featured Lesson */}
          <section className="mb-8">
            <FeaturedLesson />
          </section>

          {/* Student Dashboard */}
          <section className="mb-8">
            <StudentDashboard userId={profile?.user_id || ""} />
          </section>
        </main>

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentMode="student"
          isEduVerified={true}
          userLocation={profile?.home_location || null}
          userFirstName={profile?.first_name || null}
          solacePersonality={profile?.preferences?.solaceTone || "educational"}
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
