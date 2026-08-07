import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LifeTask {
  id: string;
  category: string;
  title: string;
  description: string | null;
}

const categories = [
  { key: "identification", label: "Identification & Documents", icon: "📄" },
  { key: "healthcare", label: "Healthcare & Insurance", icon: "🏥" },
  { key: "housing", label: "Housing & Utilities", icon: "🏠" },
  { key: "food", label: "Food & Basic Needs", icon: "🍎" },
  { key: "transportation", label: "Transportation", icon: "🚌" },
  { key: "benefits", label: "Benefits & Financial Support", icon: "💰" },
  { key: "employment", label: "Employment Basics", icon: "💼" },
  { key: "education", label: "School & Training", icon: "📚" },
  { key: "digital", label: "Digital Life & Accounts", icon: "💻" },
];

export default function LifeTasksLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("life_tasks")
        .select("id, category, title, description")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksByCategory = (categoryKey: string) => {
    return tasks.filter((task) => task.category === categoryKey);
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/life-task/${taskId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Life Tasks Library</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Browse Common Adult Life Tasks</CardTitle>
            <CardDescription>
              Tap any task to get step-by-step instructions, document lists, and scripts
              to help you navigate everyday challenges with confidence.
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {categories.map((category) => {
              const categoryTasks = getTasksByCategory(category.key);
              if (categoryTasks.length === 0) return null;

              return (
                <AccordionItem
                  key={category.key}
                  value={category.key}
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold">{category.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryTasks.length} task{categoryTasks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-2">
                      {categoryTasks.map((task) => (
                        <Button
                          key={task.id}
                          variant="ghost"
                          className="w-full justify-between h-auto p-4 text-left"
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {!isLoading && tasks.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No tasks available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
