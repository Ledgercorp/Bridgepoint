import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  BookOpen,
  Target,
  ClipboardList,
  Clock,
  Lightbulb
} from "lucide-react";
import { useUserMode } from "@/hooks/useUserMode";
import { useEffect } from "react";

interface Assignment {
  title: string;
  description: string;
  objectives: string[];
  instructions: string[];
  bridgepointFeatures: string[];
  assessmentCriteria: string[];
  estimatedTime: string;
  tips: string[];
}

export default function AssignmentCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInstructorVerified, currentMode, loading: userLoading, isAdmin } = useUserMode();
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [topic, setTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [features, setFeatures] = useState("Life Tasks, Mini-Lessons");
  const [context, setContext] = useState("");

  // Assignment Creator is instructor-only (admins can bypass)
  const hasAccess = isAdmin || (isInstructorVerified && currentMode === "instructor");

  useEffect(() => {
    if (!userLoading && !hasAccess) {
      navigate("/community-home");
    }
  }, [userLoading, hasAccess, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter an assignment topic",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-assignment', {
        body: {
          topic: topic.trim(),
          objectives: objectives.trim() || "Help students develop practical life skills",
          features: features.trim(),
          context: context.trim() || "College students learning life skills"
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Please wait a moment before generating another assignment.",
            variant: "destructive",
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setAssignment(data.assignment);
      toast({
        title: "Assignment Generated",
        description: "Your assignment has been created successfully!",
      });
    } catch (error) {
      console.error('Error generating assignment:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!assignment) return;

    const text = `
${assignment.title}

${assignment.description}

LEARNING OBJECTIVES:
${assignment.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

INSTRUCTIONS:
${assignment.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}

BRIDGEPOINT FEATURES TO USE:
${assignment.bridgepointFeatures.map((feat, i) => `${i + 1}. ${feat}`).join('\n')}

ASSESSMENT CRITERIA:
${assignment.assessmentCriteria.map((crit, i) => `${i + 1}. ${crit}`).join('\n')}

ESTIMATED TIME: ${assignment.estimatedTime}

TIPS FOR SUCCESS:
${assignment.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Assignment copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!assignment) return;

    const text = `
${assignment.title}

${assignment.description}

LEARNING OBJECTIVES:
${assignment.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

INSTRUCTIONS:
${assignment.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}

BRIDGEPOINT FEATURES TO USE:
${assignment.bridgepointFeatures.map((feat, i) => `${i + 1}. ${feat}`).join('\n')}

ASSESSMENT CRITERIA:
${assignment.assessmentCriteria.map((crit, i) => `${i + 1}. ${crit}`).join('\n')}

ESTIMATED TIME: ${assignment.estimatedTime}

TIPS FOR SUCCESS:
${assignment.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Assignment saved to your device",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-500/5 to-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/instructor-home")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Instructor Home
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Assignment Creator</h1>
              <p className="text-muted-foreground">Generate BridgePoint-based assignments with AI</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Assignment Details
              </CardTitle>
              <CardDescription>
                Describe what you want students to learn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Assignment Topic *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., Navigating Healthcare Systems, Finding Housing, Building a Budget"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="What should students learn? (Optional)"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="features">BridgePoint Features to Include</Label>
                <Textarea
                  id="features"
                  placeholder="e.g., Life Tasks, Mini-Lessons, Resource Finder"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="context">Student Context</Label>
                <Textarea
                  id="context"
                  placeholder="Grade level, course context, etc. (Optional)"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Assignment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Assignment */}
          <div className="space-y-4">
            {!assignment ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No assignment generated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details and click Generate
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDownload}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Learning Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {assignment.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                      Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {assignment.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </Badge>
                          <span className="pt-0.5">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      BridgePoint Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {assignment.bridgepointFeatures.map((feat, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Assessment Criteria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {assignment.assessmentCriteria.map((crit, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Estimated Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{assignment.estimatedTime}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {assignment.tips.map((tip, i) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <span className="text-yellow-600">💡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}