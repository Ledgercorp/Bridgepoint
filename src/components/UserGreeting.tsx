import { MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/hooks/useUserMode";

interface UserGreetingProps {
  profile: UserProfile | null;
  onChangeLocation: () => void;
}

export function UserGreeting({ profile, onChangeLocation }: UserGreetingProps) {
  const getLocationDisplay = () => {
    if (!profile?.home_location) {
      return (
        <button
          onClick={onChangeLocation}
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          Location not set — tap to choose your area
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Showing resources near {profile.home_location}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onChangeLocation}
          className="h-7 px-2"
        >
          <Settings className="h-3 w-3 mr-1" />
          Change
        </Button>
      </div>
    );
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-3">
        {profile?.first_name ? `Hi, ${profile.first_name}` : "Hello"}
      </h1>
      <div className="text-base md:text-lg">
        {getLocationDisplay()}
      </div>
    </div>
  );
}
