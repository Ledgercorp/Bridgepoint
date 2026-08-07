import { useState } from "react";
import { ArrowLeft, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickTask {
  key: string;
  label: string;
  prompt: string;
  category: string;
}

const quickTasks: QuickTask[] = [
  {
    key: "find-dmv",
    label: "Find my nearest DMV",
    prompt: "Help me find the nearest DMV office and tell me what I need to bring to get a state ID.",
    category: "identification"
  },
  {
    key: "walk-in-clinic",
    label: "Find a walk-in clinic",
    prompt: "Help me find walk-in clinics or urgent care near me and explain what to expect when I go.",
    category: "healthcare"
  },
  {
    key: "food-today",
    label: "Find food today",
    prompt: "I need food today. Help me find food banks, meal programs, or places that can help right now.",
    category: "food"
  },
  {
    key: "replace-id",
    label: "Replace my ID",
    prompt: "My ID was lost or stolen. Walk me through how to replace it step by step.",
    category: "identification"
  },
  {
    key: "setup-voicemail",
    label: "Set up voicemail",
    prompt: "Help me set up a basic professional voicemail greeting on my phone.",
    category: "digital"
  },
  {
    key: "medicaid-steps",
    label: "Check the steps to apply for Medicaid",
    prompt: "Walk me through how to apply for Medicaid, what documents I need, and what to expect.",
    category: "healthcare"
  },
  {
    key: "rent-help",
    label: "Find rent or utility help",
    prompt: "I need help paying rent or utilities. Show me what programs are available and how to apply.",
    category: "housing"
  },
  {
    key: "job-documents",
    label: "What documents do I need for a job?",
    prompt: "What documents do I need to bring when I start a new job? Help me make sure I have everything.",
    category: "employment"
  },
];

export default function QuickTasks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingTask, setLoadingTask] = useState<string | null>(null);

  const handleTaskClick = async (task: QuickTask) => {
    setLoadingTask(task.key);

    // Log usage anonymously
    try {
      await supabase.from("quick_task_usage").insert({ task_key: task.key });
    } catch (error) {
      console.error("Error logging task usage:", error);
    }

    // Navigate to step-by-step help with the prompt
    navigate(`/step-by-step-help?prompt=${encodeURIComponent(task.prompt)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Quick Tasks</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instant Access to Common Tasks</CardTitle>
            <CardDescription>
              Tap any task below to get immediate help without typing.
              Solace will provide step-by-step guidance, scripts, and nearby resources.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Popular This Week</CardTitle>
            </div>
            <CardDescription>
              Most-used quick tasks from the BridgePoint community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {quickTasks.slice(0, 3).map((task) => (
                <Button
                  key={task.key}
                  variant="outline"
                  className="h-auto p-4 justify-start text-left bg-background"
                  onClick={() => handleTaskClick(task)}
                  disabled={loadingTask === task.key}
                >
                  <Zap className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                  <span className="flex-1">
                    {loadingTask === task.key ? "Loading..." : task.label}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Quick Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {quickTasks.map((task) => (
                <Button
                  key={task.key}
                  variant="outline"
                  className="h-auto p-4 justify-start text-left"
                  onClick={() => handleTaskClick(task)}
                  disabled={loadingTask === task.key}
                >
                  <span className="flex-1">
                    {loadingTask === task.key ? "Loading..." : task.label}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
