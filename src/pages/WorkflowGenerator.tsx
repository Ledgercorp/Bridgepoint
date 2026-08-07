import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Clock, FileText, Phone, AlertTriangle,
  Copy, Lightbulb, MessageSquare, ArrowLeft
} from "lucide-react";

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  timeframe: string;
  tips?: string[];
}

interface Obstacle {
  obstacle: string;
  solution: string;
}

interface Scripts {
  phone?: string;
  in_person?: string;
}

interface GeneratedWorkflow {
  title: string;
  steps: WorkflowStep[];
  documents_needed: string[];
  alternatives?: string[];
  scripts?: Scripts;
  obstacles?: Obstacle[];
  typical_timeframe: string;
  followup?: string;
}

export default function WorkflowGeneratorPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isProfessionalVerified, isAdmin: isSuperAdmin } = useUserMode();
  const [scenario, setScenario] = useState("");
  const [location, setLocation] = useState("");
  const [generating, setGenerating] = useState(false);
  const [workflow, setWorkflow] = useState<GeneratedWorkflow | null>(null);

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  const handleGenerate = async () => {
    if (!scenario.trim()) {
      toast({
        title: "Scenario Required",
        description: "Please describe the situation you need help with",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      console.log("Calling generate-workflow with:", { scenario, location });

      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { scenario, location }
      });

      console.log("Response:", { data, error });

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (data?.workflow) {
        setWorkflow(data.workflow);
        toast({
          title: "Workflow Generated",
          description: "Your detailed workflow is ready",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No workflow returned");
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!workflow) return;

    const text = `
${workflow.title}
${'='.repeat(workflow.title.length)}

TYPICAL TIMEFRAME: ${workflow.typical_timeframe}

STEPS:
${workflow.steps.map(step => `
${step.number}. ${step.title}
   ${step.description}
   Timeframe: ${step.timeframe}
   ${step.tips ? `Tips: ${step.tips.join(', ')}` : ''}
`).join('\n')}

DOCUMENTS NEEDED:
${workflow.documents_needed.map(doc => `- ${doc}`).join('\n')}

${workflow.alternatives ? `ALTERNATIVES:\n${workflow.alternatives.map(alt => `- ${alt}`).join('\n')}\n` : ''}

${workflow.scripts?.phone ? `PHONE SCRIPT:\n${workflow.scripts.phone}\n` : ''}

${workflow.scripts?.in_person ? `IN-PERSON SCRIPT:\n${workflow.scripts.in_person}\n` : ''}

${workflow.obstacles ? `COMMON OBSTACLES:\n${workflow.obstacles.map(o => `- ${o.obstacle}\n  Solution: ${o.solution}`).join('\n')}\n` : ''}

${workflow.followup ? `FOLLOW-UP:\n${workflow.followup}` : ''}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Workflow copied to clipboard",
    });
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container max-w-4xl py-8 px-4">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              This feature requires Professional Mode access. Please verify your professional status to use this tool.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container max-w-4xl py-8 px-4 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Intelligent Workflow Generator
            </CardTitle>
            <CardDescription>
              Generate detailed step-by-step workflows for helping community members navigate systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertDescription>
                This tool generates workflows based on general scenarios. Never include personal information.
                Use this for staff training and preparation, not for individual case management.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scenario</label>
              <Textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Example: Someone needs help getting a state ID but doesn't have a birth certificate"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location (Optional)</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or ZIP code"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {workflow && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{workflow.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4" />
                    Typical timeframe: {workflow.typical_timeframe}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Steps */}
              <section>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Steps
                </h3>
                <div className="space-y-4">
                  {workflow.steps.map((step) => (
                    <Card key={step.number} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Badge className="mt-1">{step.number}</Badge>
                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold">{step.title}</h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {step.timeframe}
                            </div>
                            {step.tips && step.tips.length > 0 && (
                              <div className="mt-2 p-2 bg-amber-500/10 rounded-md">
                                <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                  Tips:
                                </div>
                                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                                  {step.tips.map((tip, i) => (
                                    <li key={i}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Documents Needed */}
              <section>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents Needed
                </h3>
                <ul className="space-y-2">
                  {workflow.documents_needed.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">✓</Badge>
                      <span className="text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Alternatives */}
              {workflow.alternatives && workflow.alternatives.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      Alternative Pathways
                    </h3>
                    <ul className="space-y-2">
                      {workflow.alternatives.map((alt, i) => (
                        <li key={i} className="text-sm p-3 bg-amber-500/10 rounded-md border border-amber-500/20">
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}

              {/* Scripts */}
              {workflow.scripts && (workflow.scripts.phone || workflow.scripts.in_person) && (
                <>
                  <Separator />
                  <section className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Scripts
                    </h3>

                    {workflow.scripts.phone && (
                      <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Script
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-line">{workflow.scripts.phone}</p>
                        </CardContent>
                      </Card>
                    )}

                    {workflow.scripts.in_person && (
                      <Card className="bg-green-500/5 border-green-500/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            In-Person Script
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-line">{workflow.scripts.in_person}</p>
                        </CardContent>
                      </Card>
                    )}
                  </section>
                </>
              )}

              {/* Obstacles */}
              {workflow.obstacles && workflow.obstacles.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Common Obstacles & Solutions
                    </h3>
                    <div className="space-y-3">
                      {workflow.obstacles.map((item, i) => (
                        <Card key={i} className="border-l-4 border-l-red-500">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-sm text-red-900 dark:text-red-100">
                                {item.obstacle}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-green-700 dark:text-green-300">Solution:</span> {item.solution}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Follow-up */}
              {workflow.followup && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-3">Follow-up</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm">{workflow.followup}</p>
                      </CardContent>
                    </Card>
                  </section>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
