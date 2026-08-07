import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface LocationSetupProps {
  onLocationSet: (location: string, locationType: 'zip' | 'city_state') => void;
  initialLocation?: string | null;
  showAsDialog?: boolean;
}

export function LocationSetup({ onLocationSet, initialLocation, showAsDialog = false }: LocationSetupProps) {
  const [zipCode, setZipCode] = useState(initialLocation || "");
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const { toast } = useToast();

  const handleUseCurrentLocation = async () => {
    setIsUsingGPS(true);
    try {
      if (!navigator.geolocation) {
        toast({
          variant: "destructive",
          title: "Location Not Available",
          description: "Your browser doesn't support location services.",
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding to get city and state
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            // Extract city and state
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";

            if (city && state) {
              const locationString = `${city}, ${state}`;
              onLocationSet(locationString, 'city_state');
              toast({
                title: "Location Set",
                description: `Using ${locationString}`,
              });
            } else {
              throw new Error("Could not determine city and state");
            }
          } catch (error) {
            console.error("Geocoding error:", error);
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Could not determine your area. Please enter city and state manually.",
            });
          } finally {
            setIsUsingGPS(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsUsingGPS(false);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Please enter city and state manually.",
          });
        }
      );
    } catch (error) {
      console.error("Error:", error);
      setIsUsingGPS(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access your location.",
      });
    }
  };

  const handleCityStateSubmit = () => {
    const cleanLocation = zipCode.trim();
    if (!cleanLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enter a city and state.",
      });
      return;
    }

    // Basic validation for city, state format
    if (!cleanLocation.includes(',')) {
      toast({
        variant: "destructive",
        title: "Invalid Format",
        description: "Please enter in format: City, State (e.g., Boston, MA)",
      });
      return;
    }

    onLocationSet(cleanLocation, 'city_state');
    toast({
      title: "Location Set",
      description: `Using ${cleanLocation}`,
    });
  };

  const containerClass = showAsDialog
    ? "space-y-6"
    : "min-h-screen bg-background flex items-center justify-center p-4";

  const contentElement = (
    <>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <CardTitle>Set Your Location</CardTitle>
        </div>
        <CardDescription>
          We'll use this area to find resources and services near you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Option 1: Use Current Location */}
        <div>
          <Button
            onClick={handleUseCurrentLocation}
            disabled={isUsingGPS}
            className="w-full"
            size="lg"
          >
            {isUsingGPS ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Use My Current Location
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Uses the device's location once to set your general area.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Option 2: Enter City and State */}
        <div className="space-y-3">
          <div>
            <label htmlFor="city-state" className="text-sm font-medium">
              Enter City and State
            </label>
            <Input
              id="city-state"
              type="text"
              placeholder="e.g. Boston, MA"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCityStateSubmit()}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-2">
              We'll use this to show nearby resources.
            </p>
          </div>
          <Button onClick={handleCityStateSubmit} variant="outline" className="w-full">
            Set Location
          </Button>
        </div>

        {/* Privacy Notice */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Privacy Note:</strong> We don't show your exact address.
            Your location is only used to find nearby resources and can be changed anytime.
          </AlertDescription>
        </Alert>
      </CardContent>
    </>
  );

  if (showAsDialog) {
    return <div className={containerClass}>{contentElement}</div>;
  }

  return (
    <div className={containerClass}>
      <Card className="w-full max-w-md">
        {contentElement}
      </Card>
    </div>
  );
}
