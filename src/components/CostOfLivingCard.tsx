import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserMode } from "@/hooks/useUserMode";

export function CostOfLivingCard() {
  const navigate = useNavigate();
  const { profile } = useUserMode();
  const [pulseOpacity, setPulseOpacity] = useState(1);

  // Animate the "live" indicator
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick = (tick + 1) % 60;
      setPulseOpacity(0.85 + (Math.sin(tick / 10) * 0.15));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!profile?.home_location) {
    return null;
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-card/80"
      onClick={() => navigate('/cost-of-living')}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{ opacity: pulseOpacity }}
                />
                <span className="text-xs text-muted-foreground font-medium">Updating...</span>
              </div>
              <h3 className="font-semibold text-lg">Cost of living</h3>
              <p className="text-sm text-muted-foreground">
                in {profile.home_location}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
