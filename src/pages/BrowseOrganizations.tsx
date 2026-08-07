import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Phone, Globe, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  organization_type: string | null;
  services: string[] | null;
  latitude: number;
  longitude: number;
  connection_code: string;
  distance?: number;
}

export default function BrowseOrganizations() {
  const navigate = useNavigate();
  const { coordinates, requestLocation, loading: locationLoading, error: locationError } = useGeolocation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (coordinates) {
      fetchOrganizations();
    }
  }, [coordinates]);

  const fetchOrganizations = async () => {
    if (!coordinates) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, description, city, state, address, phone, website, organization_type, services, latitude, longitude, connection_code")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .not("connection_code", "is", null);

      if (error) throw error;

      // Calculate distances and sort
      const orgsWithDistance = data.map((org) => ({
        ...org,
        distance: calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          org.latitude,
          org.longitude
        ),
      })).sort((a, b) => a.distance - b.distance);

      setOrganizations(orgsWithDistance);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load organizations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocation = async () => {
    if (!manualCity || !manualState) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both city and state",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-location', {
        body: { city: manualCity, state: manualState }
      });

      if (error) throw error;
      if (!data || !data.latitude || !data.longitude) {
        throw new Error('Invalid geocoding response');
      }

      // Manually set coordinates to trigger the effect
      requestLocation(); // This will update the useGeolocation hook
      toast({
        title: "Location Found",
        description: `Searching near ${data.displayName || `${manualCity}, ${manualState}`}`,
      });

      // Fetch organizations with manual coordinates
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name, description, city, state, address, phone, website, organization_type, services, latitude, longitude, connection_code")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .not("connection_code", "is", null);

      if (orgsError) throw orgsError;

      // Calculate distances and sort
      const orgsWithDistance = orgsData.map((org) => ({
        ...org,
        distance: calculateDistance(
          data.latitude,
          data.longitude,
          org.latitude,
          org.longitude
        ),
      })).sort((a, b) => a.distance - b.distance);

      setOrganizations(orgsWithDistance);
      setShowManualInput(false);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Location Not Found",
        description: error.message || "Could not find that location. Please check spelling.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/community-home")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Organizations Near You</h1>
          <p className="text-muted-foreground">
            Connect with nonprofits and community organizations in your area
          </p>
        </div>

        {!coordinates && !showManualInput && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location Required</CardTitle>
              <CardDescription>
                We need your location to show organizations near you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={requestLocation} disabled={locationLoading} className="w-full">
                {locationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <MapPin className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
                className="w-full"
              >
                Enter Location Manually
              </Button>
              {locationError && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
            </CardContent>
          </Card>
        )}

        {showManualInput && !coordinates && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enter Your Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Springfield"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder="MA"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleManualLocation} className="flex-1">
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1"
                >
                  Use GPS Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {coordinates && !loading && organizations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No organizations found near your location
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/organization-directory")}
              >
                Enter Connection Code Manually
              </Button>
            </CardContent>
          </Card>
        )}

        {coordinates && !loading && organizations.length > 0 && (
          <div className="space-y-4">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{org.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {org.organization_type && (
                          <Badge variant="secondary">{org.organization_type}</Badge>
                        )}
                        <span>•</span>
                        <span>{org.city}, {org.state}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      <MapPin className="h-3 w-3 mr-1" />
                      {formatDistance(org.distance!)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {org.description && (
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                  )}

                  {org.services && org.services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {org.services.map((service, idx) => (
                        <Badge key={idx} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {org.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${org.phone}`} className="hover:text-primary">
                          {org.phone}
                        </a>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          {org.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => navigate(`/organization-directory?code=${org.connection_code}`)}
                  >
                    Connect to Organization
                  </Button>
                </CardContent>
              </Card>
            ))}

            <div className="text-center pt-4">
              <Button
                variant="link"
                onClick={() => navigate("/organization-directory")}
              >
                Or enter a connection code manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
