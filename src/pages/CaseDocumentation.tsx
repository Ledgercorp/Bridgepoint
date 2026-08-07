import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Loader2, FileText, Copy, Download,
  Sparkles, CheckCircle, AlertCircle, Clock
} from "lucide-react";

export default function CaseDocumentation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();

  const [clientSituation, setClientSituation] = useState("");
  const [servicesNeeded, setServicesNeeded] = useState("");
  const [barriers, setBarriers] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState<string | null>(null);

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  const handleGenerate = async () => {
    if (!clientSituation.trim()) {
      toast({
        variant: "destructive",
        title: "Client Situation Required",
        description: "Please describe the client's situation",
      });
      return;
    }

    if (!hasAccess) {
      toast({
        title: "Professional Access Required",
        description: "This feature requires Professional Mode access.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setDocumentation(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-case-documentation', {
        body: {
          clientSituation,
          servicesNeeded,
          barriers,
          currentDateTime: new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setDocumentation(data.documentation);
      toast({
        title: "Documentation Generated",
        description: "Your case documentation is ready",
      });
    } catch (error) {
      console.error('Error generating documentation:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate documentation",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (documentation) {
      navigator.clipboard.writeText(documentation);
      toast({
        title: "Copied",
        description: "Documentation copied to clipboard",
      });
    }
  };

  const quickTemplates = [
    {
      label: "Housing Crisis",
      situation: "Client experiencing housing instability, facing possible eviction within 30 days",
      services: "Emergency shelter, rental assistance, housing navigation",
      barriers: "Limited income, no rental history, previous eviction on record"
    },
    {
      label: "Benefits Application",
      situation: "Client needs assistance applying for public benefits",
      services: "SNAP, Medicaid, TANF application support",
      barriers: "Missing documentation, language barriers, transportation issues"
    },
    {
      label: "Healthcare Access",
      situation: "Client without health insurance needs medical care",
      services: "Insurance enrollment, community health center referral",
      barriers: "Immigration status concerns, no primary care provider"
    },
  ];

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Case Documentation</h1>
              <p className="text-muted-foreground">
                AI-powered case summaries, recommendations, and action plans
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Case Information
                </CardTitle>
                <CardDescription>
                  Enter details to generate comprehensive documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickTemplates.map((template) => (
                    <Button
                      key={template.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setClientSituation(template.situation);
                        setServicesNeeded(template.services);
                        setBarriers(template.barriers);
                      }}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Client Situation *</Label>
                  <Textarea
                    placeholder="Describe the client's current situation, needs, and circumstances (no identifying information)..."
                    value={clientSituation}
                    onChange={(e) => setClientSituation(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Services Needed</Label>
                  <Input
                    placeholder="e.g., Housing assistance, food support, healthcare"
                    value={servicesNeeded}
                    onChange={(e) => setServicesNeeded(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Barriers to Services</Label>
                  <Textarea
                    placeholder="Any challenges or barriers the client faces..."
                    value={barriers}
                    onChange={(e) => setBarriers(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !clientSituation.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Documentation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Case Documentation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Professional case summary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Recommended resources and referrals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Step-by-step action plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Follow-up recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Documentation</CardTitle>
                {documentation && (
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documentation ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{documentation}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter case details and click generate</p>
                  <p className="text-sm mt-1">Documentation will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}