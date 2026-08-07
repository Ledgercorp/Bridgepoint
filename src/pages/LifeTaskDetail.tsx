import { useState, useEffect } from "react";
import { ArrowLeft, Save, MapPin, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { AudioReader } from "@/components/AudioReader";
import { Separator } from "@/components/ui/separator";
import type { Json } from "@/integrations/supabase/types";

interface LifeTask {
  id: string;
  category: string;
  title: string;
  description: string | null;
  steps: Json;
  documents_needed: string[] | null;
  what_to_expect: string | null;
  scripts: string | null;
  related_resource_categories: string[] | null;
}

export default function LifeTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, currentMode } = useUserMode();
  const [task, setTask] = useState<LifeTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from("life_tasks")
        .select("*")
        .eq("id", taskId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Task not found.",
      });
      navigate("/life-tasks-library");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSteps = async () => {
    if (!user || !task) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("saved_navigation_steps").insert({
        user_id: user.id,
        title: task.title,
        category: task.category,
        steps: task.steps,
      });

      if (error) throw error;

      toast({
        title: "Steps Saved",
        description: `Saved to ${currentMode === "student" ? "Resource Kits" : "My Lists"}`,
      });
    } catch (error) {
      console.error("Error saving steps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save steps.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFindResources = () => {
    navigate("/?search=true");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/life-tasks-library")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!task) return null;

  const stepsArray = Array.isArray(task.steps)
    ? task.steps
    : task.steps && typeof task.steps === "object" && "steps" in task.steps && Array.isArray(task.steps.steps)
      ? task.steps.steps
      : [];
  const fullContent = `${task.title}. ${task.description || ""}. Steps: ${stepsArray.join(". ")}. ${task.what_to_expect || ""}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/life-tasks-library")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold flex-1">{task.title}</h1>
          <AudioReader text={fullContent} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {task.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{task.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {stepsArray.map((step: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {index + 1}
                  </span>
                  <p className="flex-1 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {task.documents_needed && task.documents_needed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documents You'll Need</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {task.documents_needed.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {task.what_to_expect && (
          <Card>
            <CardHeader>
              <CardTitle>What to Expect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{task.what_to_expect}</p>
            </CardContent>
          </Card>
        )}

        {task.scripts && (
          <Card>
            <CardHeader>
              <CardTitle>What to Say (Scripts)</CardTitle>
              <CardDescription>You can use these phrases when talking to staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm">{task.scripts}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex flex-col sm:flex-row gap-3">
          {user && (
            <Button
              onClick={handleSaveSteps}
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save These Steps"}
            </Button>
          )}
          <Button
            onClick={handleFindResources}
            variant="outline"
            className="flex-1 gap-2"
          >
            <MapPin className="h-4 w-4" />
            Find Related Resources Near Me
          </Button>
        </div>
      </main>
    </div>
  );
}
