import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Mail, Phone, FileText, Shield, CheckCircle } from 'lucide-react';

interface OrgVerificationRequestProps {
  onSuccess?: () => void;
}

export function OrgVerificationRequest({ onSuccess }: OrgVerificationRequestProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationEmail: '',
    organizationDomain: '',
    organizationType: '',
    contactName: '',
    contactPhone: '',
    description: '',
    taxId: '',
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organizationName || !formData.organizationEmail || !formData.organizationType || !formData.contactName || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('organization_verification_requests')
        .insert({
          user_id: user.id,
          organization_name: formData.organizationName,
          organization_email: formData.organizationEmail,
          organization_domain: formData.organizationDomain || null,
          organization_type: formData.organizationType,
          contact_name: formData.contactName,
          contact_phone: formData.contactPhone || null,
          description: formData.description,
          tax_id: formData.taxId || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Request Submitted',
        description: 'Your organization verification request has been submitted for review',
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit verification request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/10">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Request Submitted Successfully</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your organization verification request has been submitted. Our team will review it and contact you within 2-3 business days.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• BridgePoint team reviews your organization details</li>
                <li>• We may reach out for additional verification</li>
                <li>• Once approved, you can access Professional Mode</li>
                <li>• Check your email for status updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Organization Verification Request</CardTitle>
              <CardDescription>
                Submit your organization details for Professional Mode access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">
                Organization Name *
              </Label>
              <Input
                id="org-name"
                placeholder="Hope Community Services"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-email">
                  Organization Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-email"
                    type="email"
                    className="pl-10"
                    placeholder="contact@hopecommunity.org"
                    value={formData.organizationEmail}
                    onChange={(e) => setFormData({ ...formData, organizationEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-domain">
                  Organization Domain (Optional)
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-domain"
                    className="pl-10"
                    placeholder="hopecommunity.org"
                    value={formData.organizationDomain}
                    onChange={(e) => setFormData({ ...formData, organizationDomain: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-type">
                Organization Type *
              </Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => setFormData({ ...formData, organizationType: value })}
                required
              >
                <SelectTrigger id="org-type">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nonprofit">Nonprofit Organization (501c3)</SelectItem>
                  <SelectItem value="shelter">Shelter / Housing Program</SelectItem>
                  <SelectItem value="community_center">Community Center</SelectItem>
                  <SelectItem value="outreach">Outreach Organization</SelectItem>
                  <SelectItem value="food_bank">Food Bank / Pantry</SelectItem>
                  <SelectItem value="healthcare">Healthcare / Clinic</SelectItem>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">
                  Contact Name *
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact-name"
                    className="pl-10"
                    placeholder="John Smith"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">
                  Contact Phone (Optional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact-phone"
                    type="tel"
                    className="pl-10"
                    placeholder="(555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Organization Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your organization's mission and the community services you provide..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Help us understand how your organization serves the community
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-id">
                Tax ID / EIN (Optional)
              </Label>
              <Input
                id="tax-id"
                placeholder="12-3456789"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Providing your EIN helps speed up verification
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Verification Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
