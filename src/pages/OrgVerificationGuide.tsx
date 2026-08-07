import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, Clock, FileText, Shield, Mail, Phone,
  Building2, AlertCircle, ArrowRight, Info
} from "lucide-react";

export default function OrgVerificationGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Organization Verification Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about getting your organization verified for Professional Mode access
          </p>
        </div>

        {/* Requirements Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Eligibility Requirements
            </CardTitle>
            <CardDescription>
              Professional Mode is exclusively for verified organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Eligible Organizations
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>501(c)(3) Nonprofit Organizations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Homeless Shelters & Housing Programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Community Centers & Outreach Organizations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Food Banks & Pantries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Healthcare Clinics & Free Clinics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Government Social Service Agencies</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  Not Eligible
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Individual users or consultants</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>For-profit businesses</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Religious organizations without 501(c)(3) status</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Personal projects or informal groups</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Verification Process Timeline
            </CardTitle>
            <CardDescription>
              What to expect during the review process (typically 2-3 business days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2"></div>
                </div>
                <div className="pb-8 flex-1">
                  <h3 className="font-semibold mb-2">Submit Application</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Complete the verification request form with your organization details
                  </p>
                  <Badge variant="outline">Immediate</Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2"></div>
                </div>
                <div className="pb-8 flex-1">
                  <h3 className="font-semibold mb-2">Initial Review</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    BridgePoint team reviews your organization details and verifies information
                  </p>
                  <Badge variant="secondary">1-2 business days</Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2"></div>
                </div>
                <div className="pb-8 flex-1">
                  <h3 className="font-semibold mb-2">Verification (If Needed)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    We may reach out for additional documentation or clarification
                  </p>
                  <Badge variant="secondary">0-1 business day</Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Decision & Notification</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receive email notification of approval or request for additional information
                  </p>
                  <Badge className="bg-green-600">Complete</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Information & Documents to Prepare
            </CardTitle>
            <CardDescription>
              Have these ready before starting your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Required Information</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Organization Name</div>
                      <div className="text-xs text-muted-foreground">Official legal name of your organization</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Organization Email</div>
                      <div className="text-xs text-muted-foreground">Official email address (preferably @yourdomain)</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Contact Information</div>
                      <div className="text-xs text-muted-foreground">Primary contact name and phone number</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Organization Description</div>
                      <div className="text-xs text-muted-foreground">Mission and services provided to the community</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Optional (Speeds Up Review)</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Tax ID / EIN</div>
                      <div className="text-xs text-muted-foreground">Your organization's Employer Identification Number</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Organization Website</div>
                      <div className="text-xs text-muted-foreground">Official domain or website URL</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">501(c)(3) Documentation</div>
                      <div className="text-xs text-muted-foreground">IRS determination letter (if applicable)</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong className="block mb-2">Tips for Faster Approval</strong>
            <ul className="space-y-1 text-sm">
              <li>• Use your organization's official email domain (not Gmail, Yahoo, etc.)</li>
              <li>• Provide your Tax ID/EIN if available</li>
              <li>• Write a clear description of your organization's community services</li>
              <li>• Ensure contact information is accurate and current</li>
              <li>• Check your spam folder for our verification emails</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* CTA Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Submit your organization for verification and unlock Professional Mode tools designed for community service providers
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate("/professional-dashboard")}>
                  Start Verification
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/org-verification-status")}>
                  Check Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
