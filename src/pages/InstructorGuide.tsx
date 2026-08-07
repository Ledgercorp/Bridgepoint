import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Target,
  CheckCircle2,
  FileText,
  Users,
  Lightbulb,
  Download,
  Copy,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";

export default function InstructorGuide() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInstructorVerified, currentMode, loading: userLoading, isAdmin } = useUserMode();

  // Instructor Guide is instructor-only (admins can bypass)
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

  const assignmentIdeas = [
    {
      title: "Resource Discovery Project",
      description: "Students research and create a comprehensive resource guide for a specific life challenge",
      objectives: [
        "Develop research skills",
        "Understand community resources",
        "Practice professional communication"
      ],
      steps: [
        "Assign each student a life navigation category (housing, healthcare, etc.)",
        "Have them use BridgePoint to identify 5-10 relevant resources",
        "Students create a detailed guide with eligibility, contact info, and application processes",
        "Present findings to class"
      ]
    },
    {
      title: "Life Skills Scenario Analysis",
      description: "Students work through mini-lessons and reflect on real-world applications",
      objectives: [
        "Critical thinking about life transitions",
        "Understanding systems navigation",
        "Reflection on personal preparedness"
      ],
      steps: [
        "Assign 3-5 mini-lessons from the library",
        "Students complete lessons and practice prompts",
        "Write reflection paper on how lessons apply to their future",
        "Discussion board comparing different scenarios"
      ]
    },
    {
      title: "Community Resource Map",
      description: "Collaborative project mapping local resources by category",
      objectives: [
        "Geographic understanding of services",
        "Team collaboration",
        "Service accessibility analysis"
      ],
      steps: [
        "Divide class into teams by resource category",
        "Each team uses BridgePoint to identify resources in your area",
        "Create visual map showing resource locations and gaps",
        "Analyze accessibility and suggest improvements"
      ]
    }
  ];

  const integrationStrategies = [
    {
      course: "First-Year Seminar",
      strategy: "Use mini-lessons as weekly discussion starters about transition to college life and independence"
    },
    {
      course: "Social Work / Human Services",
      strategy: "Have students explore professional mode to understand case management workflows and resource navigation"
    },
    {
      course: "Health Education",
      strategy: "Assign healthcare navigation lessons and resource discovery projects focused on medical access"
    },
    {
      course: "Life Skills / Student Success",
      strategy: "Weekly challenges using different life task categories, tracking progress through the semester"
    }
  ];

  const evaluationRubrics = [
    {
      category: "Resource Research Quality",
      criteria: [
        "Accuracy of information gathered",
        "Depth of resource description",
        "Understanding of eligibility requirements",
        "Quality of documentation"
      ]
    },
    {
      category: "Critical Reflection",
      criteria: [
        "Personal insight demonstrated",
        "Connection to course concepts",
        "Analysis of real-world application",
        "Thoughtfulness of responses"
      ]
    },
    {
      category: "Collaboration & Participation",
      criteria: [
        "Contribution to group projects",
        "Study room participation",
        "Peer support and feedback",
        "Communication quality"
      ]
    }
  ];

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content copied successfully"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/instructor-home")}>
            ← Back to Instructor Home
          </Button>
          <h1 className="text-3xl font-bold text-foreground mt-4">Instructor Integration Guide</h1>
          <p className="text-muted-foreground mt-2">
            Curriculum planning and assignment ideas for BridgePoint
          </p>
        </div>

        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assignments">Assignment Ideas</TabsTrigger>
            <TabsTrigger value="integration">Course Integration</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation Rubrics</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {assignmentIdeas.map((assignment) => (
              <Card key={assignment.title}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription>{assignment.description}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyText(JSON.stringify(assignment, null, 2))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Learning Objectives
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {assignment.objectives.map((obj, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {obj}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Implementation Steps
                    </h4>
                    <ol className="space-y-2 ml-6">
                      {assignment.steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {idx + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course-Specific Integration Strategies</CardTitle>
                <CardDescription>
                  Ideas for incorporating BridgePoint into different course types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrationStrategies.map((strategy) => (
                  <div key={strategy.course} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        {strategy.course}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyText(strategy.strategy)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{strategy.strategy}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>General Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                    <span><strong>Start Small:</strong> Introduce one feature at a time (e.g., mini-lessons before resource kits)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                    <span><strong>Model Usage:</strong> Show students how you would use a feature in a live demo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                    <span><strong>Connect to Curriculum:</strong> Tie assignments directly to course learning outcomes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                    <span><strong>Encourage Exploration:</strong> Give students time to freely explore features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                    <span><strong>Create Study Rooms:</strong> Set up collaborative spaces for group projects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Rubrics</CardTitle>
                <CardDescription>
                  Suggested criteria for evaluating student work with BridgePoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {evaluationRubrics.map((rubric) => (
                  <div key={rubric.category} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {rubric.category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rubric.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <span>{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grading Considerations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Process over Product:</strong> Value the research and reflection process</li>
                  <li>• <strong>Personal Growth:</strong> Recognize improvement and increased confidence</li>
                  <li>• <strong>Effort & Engagement:</strong> Acknowledge thorough exploration of features</li>
                  <li>• <strong>Practical Application:</strong> Assess ability to apply learning to real scenarios</li>
                  <li>• <strong>Collaboration:</strong> Evaluate teamwork in study rooms and group projects</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}