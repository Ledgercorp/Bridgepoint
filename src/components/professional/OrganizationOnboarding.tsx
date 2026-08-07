import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Building2, Palette, Users, CheckCircle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface OrganizationOnboardingProps {
  onComplete: () => void;
}

export function OrganizationOnboarding({ onComplete }: OrganizationOnboardingProps) {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const { createOrganization, updateOrganization } = useOrganization();
  const { toast } = useToast();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an organization name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createOrganization(orgName, orgDomain || undefined);
      setStep(2);
    } catch (error) {
      // Error already handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingSetup = async () => {
    setLoading(true);
    try {
      await updateOrganization({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl || null,
      });
      setStep(3);
    } catch (error) {
      // Error already handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    toast({
      title: 'Setup Complete!',
      description: 'Your organization is ready to use Professional Mode',
    });
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Organization Setup</CardTitle>
            <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Organization Details</h3>
                  <p className="text-sm text-muted-foreground">Tell us about your organization</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Hope Community Services"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be visible to your team members
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-domain">Organization Domain (Optional)</Label>
                  <Input
                    id="org-domain"
                    placeholder="e.g., hopecommunity.org"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Team members with this email domain can join more easily
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => window.location.assign('/professional-home')}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={loading}>
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Branding</h3>
                  <p className="text-sm text-muted-foreground">Customize your organization's appearance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL (Optional)</Label>
                  <Input
                    id="logo-url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="flex gap-3">
                    <div
                      className="w-20 h-20 rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div
                      className="w-20 h-20 rounded-lg"
                      style={{ backgroundColor: secondaryColor }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleBrandingSetup} disabled={loading}>
                  {loading ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Setup Complete!</h3>
                  <p className="text-sm text-muted-foreground">Your organization is ready</p>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
                <h4 className="font-semibold">Next Steps</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Invite Team Members</p>
                      <p className="text-sm text-muted-foreground">
                        Add your staff to start collaborating
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Manage Subscriptions</p>
                      <p className="text-sm text-muted-foreground">
                        Ensure you have enough seats for your team
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleComplete} size="lg">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
