import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, UtensilsCrossed, Scale, Car, Heart, Users, Phone, DollarSign, Navigation, Loader2, AlertCircle, MapPin, HelpCircle, FileText, Lock, HeartHandshake, Zap, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import bridgepointLogo from "@/assets/bridgepoint-logo.png";
import solaceAvatar from "@/assets/solace-avatar.png";
import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { ChatPanel } from "@/components/ChatPanel";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance } from "@/lib/distance";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { CommunityOnboarding } from "@/components/onboarding/CommunityOnboarding";
import { StudentOnboarding } from "@/components/onboarding/StudentOnboarding";
import { ResourceKits } from "@/components/student/ResourceKits";
import { WeeklySummary } from "@/components/student/WeeklySummary";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { FeaturedLesson } from "@/components/student/FeaturedLesson";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UserGreeting } from "@/components/UserGreeting";
import { LocationSetup } from "@/components/LocationSetup";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CostOfLivingCard } from "@/components/CostOfLivingCard";

const categories = [
  { icon: Home, title: "Housing", description: "Emergency shelter, transitional housing, rental assistance" },
  { icon: UtensilsCrossed, title: "Food", description: "Food banks, meal programs, nutrition assistance" },
  { icon: Scale, title: "Legal Aid", description: "Free legal services, court assistance, advocacy" },
  { icon: Car, title: "Transportation", description: "Public transit, ride programs, vehicle assistance" },
  { icon: Heart, title: "DV Support", description: "Crisis services, counseling, safe housing" },
  { icon: Users, title: "Youth Programs", description: "After-school programs, mentorship, education support" },
  { icon: Phone, title: "Hotlines", description: "24/7 crisis support, information lines, referral services" },
  { icon: DollarSign, title: "Financial Help", description: "Emergency funds, bill assistance, financial counseling" },
];

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string | null;
  phone: string;
  hours: string;
  website?: string;
  eligibility: string;
  cost: string;
  latitude: number | null;
  longitude: number | null;
  distance?: number;
  is_active?: boolean;
  needs_review?: boolean;
  last_checked_at?: string | null;
  last_check_status?: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [isGeocodingZip, setIsGeocodingZip] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const { coordinates, requestLocation, loading, error: locationError } = useGeolocation();
  const { toast } = useToast();
  const { user, profile, loading: profileLoading, hasCompletedOnboarding, currentMode, isEduVerified, isProfessionalVerified, completeOnboarding, updateProfile, refreshProfile } = useUserMode();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Update redirects in Index.tsx
  useEffect(() => {
    // Index is now a shared resource finder - no redirects
    // All mode-specific content lives in dedicated home pages
  }, []);

  // Check if user needs to see onboarding
  useEffect(() => {
    if (user && profile && !profileLoading && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user, profile, profileLoading, hasCompletedOnboarding]);

  // Handle navigation state for opening chat
  useEffect(() => {
    const state = location.state as { openChat?: boolean; chatPrompt?: string } | null;
    if (state?.openChat) {
      setIsChatOpen(true);
      // Clear the state so it doesn't trigger again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  // Fetch resources from database
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoadingResources(true);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast({
          variant: "destructive",
          title: "Error Loading Resources",
          description: "Failed to load resources. Please try again.",
        });
      } finally {
        setIsLoadingResources(false);
      }
    };

    fetchResources();
  }, [toast]);

  // Geocode ZIP code using a public API
  const handleZipSearch = async () => {
    if (!zipCode.trim() || zipCode.length !== 5) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code.",
      });
      return;
    }

    setIsGeocodingZip(true);
    try {
      // Using Nominatim (OpenStreetMap) API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'BridgePointAI Community Resource Finder'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        // Manually set coordinates by calling the geolocation state
        toast({
          title: "Location Found",
          description: `Showing resources near ${zipCode}`,
        });
        // Update coordinates through custom method
        handleManualLocation(parseFloat(lat), parseFloat(lon));
      } else {
        toast({
          variant: "destructive",
          title: "ZIP Code Not Found",
          description: "Unable to find location for this ZIP code.",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        variant: "destructive",
        title: "Geocoding Error",
        description: "Failed to look up ZIP code. Please try again.",
      });
    } finally {
      setIsGeocodingZip(false);
    }
  };

  const [manualCoordinates, setManualCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Initialize with home location if available
  useEffect(() => {
    if (profile?.home_location && profile?.home_location_type === 'zip') {
      setZipCode(profile.home_location);
    }
  }, [profile]);

  // Show location setup for logged-in users without a home location
  useEffect(() => {
    if (user && profile && !profile.home_location && !showLocationSetup) {
      setShowLocationSetup(true);
    }
  }, [user, profile, showLocationSetup]);

  const handleLocationSet = async (location: string, locationType: 'zip' | 'city_state') => {
    if (!user) return;

    const success = await updateProfile({
      home_location: location,
      home_location_type: locationType,
    });

    if (success) {
      setShowLocationSetup(false);
      refreshProfile();

      // If it's a ZIP code, also use it for resource search
      if (locationType === 'zip') {
        setZipCode(location);
        // Geocode the ZIP to get coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${location}&countrycodes=us&limit=1`
          );
          const data = await response.json();
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            handleManualLocation(parseFloat(lat), parseFloat(lon));
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
    }
  };

  const handleManualLocation = (lat: number, lon: number) => {
    setManualCoordinates({ latitude: lat, longitude: lon });
  };

  const activeCoordinates = manualCoordinates || coordinates;

  // Remove debug logging
  const resourcesWithDistance = useMemo(() => {
    if (!activeCoordinates) return resources;

    const filtered = resources
      .map(resource => {
        if (resource.latitude && resource.longitude) {
          const distance = calculateDistance(
            activeCoordinates.latitude,
            activeCoordinates.longitude,
            resource.latitude,
            resource.longitude
          );
          return { ...resource, distance };
        }
        return resource;
      })
      .filter(resource => {
        if (resource.distance !== undefined) {
          return resource.distance <= maxDistance;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

    return filtered;
  }, [activeCoordinates, maxDistance, resources]);

  // Filter by category if one is selected
  const filteredResources = useMemo(() => {
    if (!selectedCategory) return resourcesWithDistance;
    return resourcesWithDistance.filter(resource => resource.category === selectedCategory);
  }, [resourcesWithDistance, selectedCategory]);

  const handleCategoryClick = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setShowResources(true);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            {currentMode === 'student' ? (
              <StudentOnboarding onComplete={handleOnboardingComplete} />
            ) : (
              <CommunityOnboarding onComplete={handleOnboardingComplete} />
            )}
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen bg-background">
        <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => setShowResources(true)} />

        <main className="container mx-auto px-4 md:px-6 py-8">
          <OfflineBanner />

        {/* User Greeting and Location */}
        {user && profile && (
          <UserGreeting
            profile={profile}
            onChangeLocation={() => setShowLocationSetup(true)}
          />
        )}

        {/* Student Mode Hero */}
        {isEduVerified && currentMode === "student" && !showResources && (
          <section className="mb-12 py-8">
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border-2 border-blue-500/20">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <GraduationCap className="w-4 h-4" />
                Student Mode
              </div>
              <div className="max-w-3xl mx-auto text-center">
                <img
                  src={bridgepointLogo}
                  alt="BridgePoint"
                  className="h-24 md:h-32 w-auto mx-auto mb-6"
                />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Master Real-World Skills
                </h1>
                <p className="text-xl text-blue-600 dark:text-blue-400 font-semibold mb-4">
                  Learn by Doing with Solace
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  Practice human services scenarios, explore resources, and develop professional competencies through interactive mini-lessons and real-world simulations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate("/mini-lessons")}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Sparkles className="h-5 w-5" />
                    Start Mini Lessons
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsChatOpen(true)}
                    className="gap-2 border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <img src={solaceAvatar} alt="Solace" className="h-5 w-5 rounded-full" />
                    Talk to Solace
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/my-hub")}
                    className="gap-2 border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <Heart className="h-5 w-5" />
                    My Hub
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Default Hero (non-student or when viewing resources) */}
        {(!isEduVerified || currentMode !== "student" || showResources) && (
          <section className="text-center mb-12 py-8 max-w-3xl mx-auto">
            <img
              src={bridgepointLogo}
              alt="BridgePoint"
              className="h-32 md:h-40 w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Explore Resources. Learn Skills. Navigate Life.
            </h1>
            <p className="text-xl text-primary font-semibold mb-4">
              With your AI guide, Solace
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Support for community members and students learning real-world navigation skills.
            </p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
              Solace offers step-by-step help, practical examples, and plain-language guidance for completing everyday tasks,
              preparing for phone calls, understanding forms, and accessing local support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => setIsChatOpen(true)}
                className="gap-2"
              >
                <img src={solaceAvatar} alt="Solace" className="h-5 w-5 rounded-full" />
                Talk to Solace
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowResources(true)}
                className="gap-2"
              >
                <MapPin className="h-5 w-5" />
                Resource Finder
              </Button>
              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/my-hub")}
                  className="gap-2"
                >
                  <Heart className="h-5 w-5" />
                  My Hub
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Featured Lesson of the Week */}
        {isEduVerified && currentMode === "student" && !showResources && (
          <section className="mb-12">
            <FeaturedLesson />
          </section>
        )}

        {/* Student Dashboard Widget */}
        {isEduVerified && currentMode === "student" && !showResources && user && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Your Dashboard</h2>
            <StudentDashboard userId={user.id} />
          </section>
        )}

        {/* Mini Lessons - Prominent Featured Section for Students */}
        {isEduVerified && currentMode === "student" && !showResources && (
          <section className="mb-12">
            <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/20 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Mini Lessons</h2>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Interactive Learning</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      Practice real-world scenarios, develop professional skills, and build confidence through guided, bite-sized lessons. Each lesson includes scenarios, reflection questions, and hands-on practice.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                        <BookOpen className="w-3 h-3" />
                        Interactive Scenarios
                      </div>
                      <div className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                        <GraduationCap className="w-3 h-3" />
                        Skills Practice
                      </div>
                      <div className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm">
                        <Heart className="w-3 h-3" />
                        Reflection & Growth
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => navigate("/mini-lessons")}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Sparkles className="h-5 w-5" />
                      Explore Mini Lessons
                    </Button>
                  </div>
                  <div className="md:w-1/3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 flex flex-col justify-center gap-4">
                    <div className="bg-background/80 backdrop-blur p-4 rounded-lg border border-blue-500/30">
                      <h4 className="font-semibold text-sm mb-1 text-foreground">What You'll Learn</h4>
                      <p className="text-xs text-muted-foreground">Client communication, crisis intervention, resource navigation</p>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-lg border border-purple-500/30">
                      <h4 className="font-semibold text-sm mb-1 text-foreground">Practice Mode</h4>
                      <p className="text-xs text-muted-foreground">Safe space to practice difficult conversations and scenarios</p>
                    </div>
                    <div className="bg-background/80 backdrop-blur p-4 rounded-lg border border-pink-500/30">
                      <h4 className="font-semibold text-sm mb-1 text-foreground">Track Progress</h4>
                      <p className="text-xs text-muted-foreground">See your completed lessons and competency development</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Student Learning Tools */}
        {isEduVerified && currentMode === "student" && !showResources && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Student Learning Tools</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-blue-500/30" onClick={() => navigate("/study-rooms")}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Study Rooms</h3>
                      <p className="text-xs text-muted-foreground">Collaborate live</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Join or create study rooms to collaborate with peers in real-time
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-purple-500/30" onClick={() => navigate("/my-hub")}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">My Hub</h3>
                      <p className="text-xs text-muted-foreground">Your workspace</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access saved resources, notes, and track your learning progress
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-pink-500/30" onClick={() => setIsChatOpen(true)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-pink-500/10">
                      <img src={solaceAvatar} alt="Solace" className="h-6 w-6 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ask Solace</h3>
                      <p className="text-xs text-muted-foreground">AI guide</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get instant help with scenarios, questions, and practice problems
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* My Hub - Featured for non-student logged in users */}
        {user && !showResources && (!isEduVerified || currentMode !== "student") && (
          <section className="mb-12">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <Heart className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-bold">My Hub</h2>
                    </div>
                    <p className="text-muted-foreground">
                      All your saved steps, documents, and recent activity in one calm, organized place
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => navigate("/my-hub")}
                    className="gap-2"
                  >
                    <Heart className="h-5 w-5" />
                    Open My Hub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Location Setup Section - Always visible on home */}
        {!showResources && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Set Your Location</h2>
            <p className="text-muted-foreground mb-6">
              Choose how you'd like to find resources near you
            </p>
            <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={requestLocation}
                  disabled={loading}
                  variant={activeCoordinates && !manualCoordinates ? "default" : "outline"}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <Navigation className="w-4 h-4" />
                  {loading ? "Finding Location..." : activeCoordinates && !manualCoordinates ? "Using My Location ✓" : "Use My Location"}
                </Button>

                <div className="flex gap-2 flex-1">
                  <Input
                    type="text"
                    placeholder="Enter ZIP code..."
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyPress={(e) => e.key === 'Enter' && handleZipSearch()}
                    maxLength={5}
                    className="flex-1"
                    disabled={isGeocodingZip}
                  />
                  <Button
                    onClick={handleZipSearch}
                    disabled={isGeocodingZip || zipCode.length !== 5}
                    variant={manualCoordinates ? "default" : "outline"}
                    className="gap-2"
                  >
                    {isGeocodingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>

              {locationError && !activeCoordinates && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Location access is required to filter by distance. Please enable location services or enter a ZIP code above.
                  </AlertDescription>
                </Alert>
              )}

              {activeCoordinates && (
                <Alert>
                  <AlertDescription className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      ✓ Location set - Ready to search for resources
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Coordinates: {activeCoordinates.latitude.toFixed(4)}, {activeCoordinates.longitude.toFixed(4)}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </section>
        )}

        {/* Life Navigation Tools Section */}
        {!showResources && activeCoordinates && (
          <section className="mb-12">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <HeartHandshake className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Life Navigation Tools</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Get trauma-informed, step-by-step support for real-world tasks like getting ID,
                applying for benefits, handling forms, and preparing for calls.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/step-by-step-help')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">Step-by-Step Help</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Break any task into simple, doable steps with Solace
                  </p>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/phone-companion')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">Phone Call Companion</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Get call scripts, questions to ask, and grounding tips
                  </p>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/form-helper')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">Form Helper</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Understand forms in plain language and know what's needed
                  </p>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/document-safe-box')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">Document Safe Box</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Securely store IDs, insurance cards, and important documents
                  </p>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/healthcare-help')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Heart className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">Healthcare Help</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Understand healthcare options, Medicaid, and low-cost clinics
                  </p>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start gap-3 bg-background hover:bg-muted transition-colors"
                  onClick={() => navigate('/im-overwhelmed')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-left">I'm Overwhelmed</h3>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Take a moment for grounding and gentle reassurance
                  </p>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Quick Access Features - Hide for students to keep focus on learning */}
        {!showResources && (!isEduVerified || currentMode !== "student") && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/healthcare-help")}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Healthcare Help</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Understand healthcare options, Medicaid, and low-cost clinics
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/quick-tasks")}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Quick Tasks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Instant help for common tasks—no typing needed
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/life-tasks-library")}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Life Tasks Library</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Browse step-by-step guides for adult life tasks
                  </p>
                </CardContent>
              </Card>

              {/* Cost of Living Card */}
              {user && profile?.home_location && (
                <CostOfLivingCard />
              )}
            </div>
          </section>
        )}

        {!showResources && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
              {activeCoordinates && (
                <Button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowResources(true);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  View All Nearby Resources
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <CategoryCard
                  key={index}
                  icon={category.icon}
                  title={category.title}
                  description={category.description}
                  onClick={() => handleCategoryClick(category.title)}
                />
              ))}
            </div>
          </section>
        )}

        {showResources && (
          <section>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResources(false);
                      setSelectedCategory(null);
                    }}
                    className="gap-2"
                  >
                    ← Back to Home
                  </Button>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedCategory ? `${selectedCategory} Resources` : "Available Resources"}
                  </h2>
                </div>
              </div>

              {/* Location Controls */}
              <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={requestLocation}
                    disabled={loading}
                    variant={activeCoordinates && !manualCoordinates ? "default" : "outline"}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Navigation className="w-4 h-4" />
                    {loading ? "Finding Location..." : activeCoordinates && !manualCoordinates ? "Using My Location ✓" : "Use My Location"}
                  </Button>

                  <div className="flex gap-2 flex-1">
                    <Input
                      type="text"
                      placeholder="Enter ZIP code..."
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      onKeyPress={(e) => e.key === 'Enter' && handleZipSearch()}
                      maxLength={5}
                      className="flex-1"
                      disabled={isGeocodingZip}
                    />
                    <Button
                      onClick={handleZipSearch}
                      disabled={isGeocodingZip || zipCode.length !== 5}
                      variant={manualCoordinates ? "default" : "outline"}
                      className="gap-2"
                    >
                      {isGeocodingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                </div>

                {locationError && !activeCoordinates && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Location access is required to filter by distance. Please enable location services or enter a ZIP code above.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {activeCoordinates && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground block">
                      Showing resources within {maxDistance} miles
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isLoadingResources ? "Loading..." : `${filteredResources.length} found`}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 25, 50].map(distance => (
                      <Button
                        key={distance}
                        size="sm"
                        variant={maxDistance === distance ? "default" : "outline"}
                        onClick={() => setMaxDistance(distance)}
                      >
                        {distance} mi
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLoadingResources ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading resources...</span>
              </div>
            ) : !activeCoordinates ? (
              <Alert className="my-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please enable location services or enter a ZIP code to see resources near you.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {!isLoadingResources && activeCoordinates && filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    id={resource.id}
                    name={resource.name}
                    category={resource.category}
                    description={resource.description}
                    address={resource.address || ""}
                    phone={resource.phone}
                    hours={resource.hours}
                    website={resource.website}
                    eligibility={resource.eligibility}
                    cost={resource.cost}
                    distance={resource.distance}
                    latitude={resource.latitude || undefined}
                    longitude={resource.longitude || undefined}
                    needsReview={resource.needs_review}
                    lastCheckedAt={resource.last_checked_at}
                    lastCheckStatus={resource.last_check_status}
                  />
                ))
              ) : activeCoordinates && !isLoadingResources ? (
                <div className="col-span-2 text-center py-12 bg-muted rounded-lg border border-border">
                  <Navigation className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {selectedCategory
                      ? `No ${selectedCategory} resources found within ${maxDistance} miles`
                      : `No resources found within ${maxDistance} miles`
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCategory
                      ? `There are no additional ${selectedCategory} resources between ${maxDistance} and the next distance range.`
                      : "Try increasing the search radius to see more resources."
                    }
                  </p>
                  {maxDistance < 50 && (
                    <Button onClick={() => setMaxDistance(50)} variant="outline">
                      Show resources within 50 miles
                    </Button>
                  )}
                  {selectedCategory && (
                    <Button
                      onClick={() => setSelectedCategory(null)}
                      variant="outline"
                      className="ml-2"
                    >
                      View all categories
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* Student Mode Features - Enhanced styling */}
        {user && currentMode === "student" && !showResources && (
          <section className="mt-12">
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border-2 border-blue-500/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Learning Resources</h2>
              </div>
              <Tabs defaultValue="kits" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-background/50 border border-blue-500/30">
                  <TabsTrigger
                    value="kits"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                  >
                    Resource Kits
                  </TabsTrigger>
                  <TabsTrigger
                    value="summary"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                  >
                    Weekly Summary
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="kits" className="mt-6">
                  <ResourceKits />
                </TabsContent>
                <TabsContent value="summary" className="mt-6">
                  <WeeklySummary />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}

        <section className="mt-12 p-6 bg-muted rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3">Important Notice</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ This tool provides <strong className="text-foreground">resource information only</strong> - no clinical advice, diagnosis, or treatment</p>
            <p>✓ No personal or health information is collected or stored</p>
            <p>✓ Always verify details with service providers before visiting</p>
          </div>
        </section>
      </main>

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentMode={currentMode}
        isEduVerified={profile?.is_edu_verified || false}
        userLocation={profile?.home_location}
        userFirstName={profile?.first_name}
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
};

export default Index;
