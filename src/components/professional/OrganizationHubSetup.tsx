import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Globe, Save, ExternalLink, Phone, Mail, MapPin,
  Building2, X, Plus, Eye, Sparkles, CheckCircle2
} from 'lucide-react';

interface OrganizationHubSetupProps {
  organizationId: string;
}

export const OrganizationHubSetup = ({ organizationId }: OrganizationHubSetupProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hub settings
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    loadOrganization();
  }, [organizationId]);

  const loadOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      setDescription(data.description || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setState(data.state || '');
      setZipCode(data.zip_code || '');
      setServices(data.services || []);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast({
        title: "Error",
        description: "Failed to load hub settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const saveHubSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zipCode.trim() || null,
          services: services.length > 0 ? services : null,
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast({
        title: "Hub Settings Saved",
        description: "Your public hub has been updated",
      });
    } catch (error) {
      console.error('Error saving hub settings:', error);
      toast({
        title: "Error",
        description: "Failed to save hub settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hub Preview Link */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Public Hub</h3>
                <p className="text-sm text-muted-foreground">
                  This is what community members see when they find your organization
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(`/hub/${organizationId}`)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview Hub
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            About Your Organization
          </CardTitle>
          <CardDescription>
            Tell community members about your organization and mission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your organization, the communities you serve, and the types of support you provide..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This appears on your hub page and helps community members understand what you do
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Services Offered
          </CardTitle>
          <CardDescription>
            List the types of services your organization provides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="pl-3 pr-1 py-1.5">
                {service}
                <button
                  onClick={() => handleRemoveService(service)}
                  className="ml-2 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">No services added yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., Housing Assistance, Food Pantry, Job Training..."
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
            />
            <Button type="button" variant="outline" onClick={handleAddService}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            How community members can reach your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.organization.org"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
          <CardDescription>
            Your organization's physical address (shown on your hub)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hub Content Summary */}
      <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            Hub Content Checklist
          </CardTitle>
          <CardDescription>
            Make sure your hub has everything community members need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Basic Info</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className={description ? 'text-green-600' : ''}>
                  {description ? '✓' : '○'} Organization description
                </li>
                <li className={services.length > 0 ? 'text-green-600' : ''}>
                  {services.length > 0 ? '✓' : '○'} Services offered
                </li>
                <li className={phone || email ? 'text-green-600' : ''}>
                  {phone || email ? '✓' : '○'} Contact information
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Content (via other tabs)</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>○ Programs & Services → Programs tab</li>
                <li>○ Upcoming Events → Events tab</li>
                <li>○ Announcements → Broadcasts tab</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/hub/${organizationId}`)}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Hub
        </Button>
        <Button onClick={saveHubSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Hub Settings"}
        </Button>
      </div>
    </div>
  );
};