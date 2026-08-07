import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Info, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Header } from "@/components/Header";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useUserMode } from "@/hooks/useUserMode";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CostCategory {
  name: string;
  icon: string;
  value: number; // -1 to 1 scale (-1 = much lower, 0 = average, 1 = much higher)
  description: string;
  explanation: string;
}

interface CostData {
  location: string;
  lastUpdated: Date;
  categories: CostCategory[];
  overallIndex: number;
}

const categoryExplanations = {
  Housing: {
    description: "Average rent and basic housing costs",
    explanation: "This includes typical rent prices, utilities often included in rent, and basic housing maintenance. Higher costs mean you'll pay more for similar housing compared to other areas."
  },
  "Food & Groceries": {
    description: "Typical grocery and basic meal costs",
    explanation: "This looks at prices for common groceries like bread, milk, vegetables, and meat. It also considers basic restaurant meals. Higher costs mean your weekly grocery bill will be larger."
  },
  Transportation: {
    description: "Gas, public transit, and travel costs",
    explanation: "This includes things like gas prices, public transit fares, and average costs for getting around the area. Higher costs might mean more expensive public transit or gas."
  },
  Utilities: {
    description: "Electricity, water, heating, internet",
    explanation: "This covers monthly bills for electricity, water, heating/cooling, and basic internet service. Higher costs mean you'll pay more for these essential services."
  },
  Healthcare: {
    description: "Basic medical care and pharmacy costs",
    explanation: "This looks at average costs for doctor visits, basic medical care, and common medications. Higher costs might mean more expensive co-pays or medical services."
  },
  "Other Basics": {
    description: "Personal care and miscellaneous needs",
    explanation: "This includes things like toiletries, clothing, basic entertainment, and other everyday items. Higher costs mean these everyday necessities will cost more."
  }
};

export default function CostOfLivingExplorer() {
  const navigate = useNavigate();
  const { profile } = useUserMode();
  const { toast } = useToast();
  const [costData, setCostData] = useState<CostData | null>(null);
  const [compareLocation, setCompareLocation] = useState<string>("");
  const [compareData, setCompareData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animationTick, setAnimationTick] = useState(0);
  const [lastRealFetch, setLastRealFetch] = useState<Date | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Animate every second for "live" feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTick((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch cost data when component mounts or location changes
  useEffect(() => {
    if (profile?.home_location) {
      fetchCostData(profile.home_location);
    }
  }, [profile?.home_location]);

  const fetchCostData = async (location: string, isComparison = false) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cost-of-living', {
        body: { location }
      });

      if (error) throw error;

      const costData: CostData = {
        location,
        lastUpdated: new Date(),
        categories: data.categories,
        overallIndex: data.overallIndex
      };

      if (isComparison) {
        setCompareData(costData);
      } else {
        setCostData(costData);
        setLastRealFetch(new Date());
        // Cache in localStorage
        localStorage.setItem('costOfLiving', JSON.stringify(costData));
      }

      toast({
        title: "Data updated",
        description: `Cost of living data for ${location} has been refreshed.`
      });
    } catch (error) {
      console.error('Error fetching cost data:', error);

      // Try to load from cache
      const cached = localStorage.getItem('costOfLiving');
      if (cached && !isComparison) {
        const cachedData = JSON.parse(cached);
        setCostData(cachedData);
        setLastRealFetch(new Date(cachedData.lastUpdated));
      }

      toast({
        title: "Could not fetch data",
        description: "Using cached data or default estimates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (profile?.home_location) {
      fetchCostData(profile.home_location);
    }
  };

  const handleCompareLocation = (location: string) => {
    setCompareLocation(location);
    if (location && location !== "none") {
      fetchCostData(location, true);
    } else {
      setCompareData(null);
    }
  };

  const handleAskSolace = () => {
    const location = costData?.location || profile?.home_location || "your area";
    const prompt = `Help me understand the cost of living in ${location}. What should I think about if I want to move here?`;
    // Navigate back to home with chat open and prefilled prompt
    navigate('/', { state: { openChat: true, chatPrompt: prompt } });
  };

  const getValueLabel = (value: number): string => {
    if (value < -0.5) return "Much lower than average";
    if (value < -0.2) return "Lower than average";
    if (value < 0.2) return "About average";
    if (value < 0.5) return "Higher than average";
    return "Much higher than average";
  };

  const getValueIcon = (value: number) => {
    if (value < -0.2) return <TrendingDown className="w-4 h-4 text-green-600" />;
    if (value > 0.2) return <TrendingUp className="w-4 h-4 text-orange-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getProgressValue = (value: number): number => {
    // Convert -1 to 1 scale to 0 to 100 scale
    return ((value + 1) / 2) * 100;
  };

  const getProgressColor = (value: number): string => {
    if (value < -0.2) return "bg-green-600";
    if (value > 0.2) return "bg-orange-600";
    return "bg-primary";
  };

  // Add subtle animation pulse based on tick
  const pulseOpacity = 0.85 + (Math.sin(animationTick / 10) * 0.15);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onChatClick={() => setIsChatOpen(true)}
        onSearchClick={() => navigate('/')}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Cost of Living Explorer</h1>
            <p className="text-muted-foreground">
              Understand basic costs in {profile?.home_location || "your area"}
            </p>
          </div>

          {/* Main Location Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>
                    Cost of living in {costData?.location || profile?.home_location || "..."}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-pulse"
                      style={{ opacity: pulseOpacity }}
                    />
                    <span>Updating...</span>
                    {lastRealFetch && (
                      <span className="text-xs">
                        • Last refreshed: {lastRealFetch.toLocaleTimeString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comparison Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Compare with:</label>
                <Select value={compareLocation} onValueChange={handleCompareLocation}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    <SelectItem value="National average">National average</SelectItem>
                    <SelectItem value="New York, NY">New York, NY</SelectItem>
                    <SelectItem value="Los Angeles, CA">Los Angeles, CA</SelectItem>
                    <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
                    <SelectItem value="Houston, TX">Houston, TX</SelectItem>
                    <SelectItem value="Phoenix, AZ">Phoenix, AZ</SelectItem>
                    <SelectItem value="Philadelphia, PA">Philadelphia, PA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {costData?.categories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {categoryExplanations[category.name as keyof typeof categoryExplanations]?.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValueIcon(category.value)}
                        <span className="text-sm font-medium">{getValueLabel(category.value)}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Info className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{category.name}</DialogTitle>
                              <DialogDescription className="space-y-2 pt-4">
                                <p className="text-foreground">
                                  {categoryExplanations[category.name as keyof typeof categoryExplanations]?.explanation}
                                </p>
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress
                        value={getProgressValue(category.value)}
                        className="h-2"
                      />
                      {compareData && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>vs {compareLocation}:</span>
                          <Progress
                            value={getProgressValue(
                              compareData.categories.find(c => c.name === category.name)?.value || 0
                            )}
                            className="h-1 flex-1 opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ask Solace Button */}
              <Button
                onClick={handleAskSolace}
                className="w-full"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Solace about this
              </Button>
            </CardContent>
          </Card>

          {/* Educational Section */}
          <Card>
            <CardHeader>
              <CardTitle>Learn more about cost of living</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <p>
                  <strong>What is cost of living?</strong> Cost of living means how expensive basic survival needs are in a place. This includes housing, food, transportation, and other everyday expenses.
                </p>
                <p>
                  <strong>Why does it matter?</strong> Understanding cost of living helps you plan your budget and make informed decisions about where you might want to live or work.
                </p>
                <p>
                  <strong>Things to remember:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Costs can change over time based on many factors</li>
                  <li>Different people have different needs, so numbers are only a rough guide</li>
                  <li>Your actual costs will depend on your lifestyle and choices</li>
                  <li>These estimates don't include things like entertainment, savings, or debt payments</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              These numbers are estimates to help you understand general costs in different areas. They are for educational purposes only and are not financial advice. Actual costs vary by individual circumstances.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {isChatOpen && (
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentMode={profile?.current_mode === 'student' ? 'student' : 'community'}
          isEduVerified={profile?.is_edu_verified || false}
        />
      )}
    </div>
  );
}
