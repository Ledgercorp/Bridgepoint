import { useState, useEffect } from "react";
import { ArrowLeft, GraduationCap, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { AudioReader } from "@/components/AudioReader";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";

interface MiniLesson {
  id: string;
  title: string;
  content: string;
  scenario: string | null;
  reflection_question: string | null;
  practice_prompt: string | null;
}

export default function MiniLessons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isEduVerified, isInstructorVerified, currentMode, loading: profileLoading, isAdmin } = useUserMode();
  const [lessons, setLessons] = useState<MiniLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<MiniLesson | null>(null);

  // Allow students (edu verified in student mode) OR instructors (instructor verified in instructor mode) OR admins
  const hasAccess = isAdmin ||
    (isEduVerified && currentMode === "student") ||
    (isInstructorVerified && currentMode === "instructor");

  useEffect(() => {
    // Wait for profile to load before checking permissions
    if (profileLoading) return;

    if (!hasAccess) {
      navigate("/community-home");
      return;
    }
    fetchLessons();
  }, [hasAccess, profileLoading, navigate]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("mini_lessons")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lessons.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format text to display proper line breaks
  const formatText = (text: string): string => {
    if (!text) return '';

    // Replace escaped newlines with actual newlines
    return text
      .replace(/\\n\\n/g, '\n\n')  // Double newlines to paragraph breaks
      .replace(/\\n/g, '\n')        // Single newlines to line breaks
      .replace(/\\\\/g, '');        // Remove double backslashes
  };

  const handlePracticeWithSolace = (lesson: MiniLesson) => {
    if (lesson.practice_prompt) {
      navigate(`/step-by-step-help?prompt=${encodeURIComponent(lesson.practice_prompt)}`);
    }
  };

  // Show loading while checking permissions
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect handled in useEffect, but show nothing if not authorized
  if (!hasAccess) {
    return null;
  }

  const getBackPath = () => {
    if (currentMode === "instructor") return "/instructor-home";
    if (currentMode === "student") return "/student-home";
    return "/community-home";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(getBackPath())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Mini Lessons</h1>
          {currentMode === "instructor" && (
            <span className="text-sm text-muted-foreground ml-2">(Preview Mode)</span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Practice Real-World Human Services Skills</CardTitle>
            <CardDescription>
              Short, non-clinical micro-learning lessons to help you develop practical
              skills for supporting people navigating community services.
            </CardDescription>
          </CardHeader>
        </Card>

        <Alert className="mb-6">
          <AlertDescription>
            <strong>Remember:</strong> Do NOT use real client information in any practice exercises.
            All scenarios and examples are educational only.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading lessons...</p>
            </CardContent>
          </Card>
        ) : selectedLesson ? (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setSelectedLesson(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Lessons
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{selectedLesson.title}</CardTitle>
                  <AudioReader text={`${selectedLesson.title}. ${formatText(selectedLesson.content)}. ${formatText(selectedLesson.scenario || "")}. ${formatText(selectedLesson.reflection_question || "")}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Lesson</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {formatText(selectedLesson.content)}
                  </p>
                </div>

                {selectedLesson.scenario && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Example Scenario</h3>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {formatText(selectedLesson.scenario)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedLesson.reflection_question && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Reflection Question</h3>
                      <p className="text-muted-foreground italic whitespace-pre-wrap">
                        {formatText(selectedLesson.reflection_question)}
                      </p>
                    </div>
                  </>
                )}

                {selectedLesson.practice_prompt && (
                  <>
                    <Separator />
                    <Button
                      onClick={() => handlePracticeWithSolace(selectedLesson)}
                      className="w-full gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Practice with Solace
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedLesson(lesson)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription className="line-clamp-2 whitespace-pre-wrap">
                    {formatText(lesson.content).substring(0, 150)}...
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && lessons.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No lessons available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
