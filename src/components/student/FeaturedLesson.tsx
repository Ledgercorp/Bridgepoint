import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { startOfWeek, differenceInWeeks, format } from "date-fns";

interface WeeklyLesson {
  title: string;
  content: string;
  scenario: string | null;
  reflection_question?: string;
  practice_prompt?: string;
}

// Get the current week number since a fixed start date
const getWeekNumber = () => {
  const startDate = new Date(2024, 0, 1);
  const now = new Date();
  return differenceInWeeks(startOfWeek(now), startOfWeek(startDate));
};

// Get week identifier for caching
const getWeekId = () => {
  return format(startOfWeek(new Date()), 'yyyy-ww');
};

export function FeaturedLesson() {
  const navigate = useNavigate();
  const [featuredLesson, setFeaturedLesson] = useState<WeeklyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekId, setWeekId] = useState(getWeekId());

  useEffect(() => {
    loadOrGenerateLesson();
  }, []);

  const loadOrGenerateLesson = async () => {
    try {
      const currentWeekId = getWeekId();
      setWeekId(currentWeekId);

      // Check localStorage for cached lesson this week
      const cachedLesson = localStorage.getItem(`solace_lesson_${currentWeekId}`);
      if (cachedLesson) {
        setFeaturedLesson(JSON.parse(cachedLesson));
        setLoading(false);
        return;
      }

      // Generate a fresh lesson from Solace
      const weekNumber = getWeekNumber();
      const { data, error } = await supabase.functions.invoke('generate-weekly-lesson', {
        body: { weekNumber }
      });

      if (error) throw error;

      if (data?.lesson) {
        setFeaturedLesson(data.lesson);
        // Cache for the week
        localStorage.setItem(`solace_lesson_${currentWeekId}`, JSON.stringify(data.lesson));
      }
    } catch (error) {
      console.error("Error loading lesson:", error);
      // Fallback to database lessons if AI fails
      await loadFallbackLesson();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackLesson = async () => {
    const { data: lessons } = await supabase
      .from("mini_lessons")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (lessons && lessons.length > 0) {
      const weekNumber = getWeekNumber();
      const lessonIndex = weekNumber % lessons.length;
      setFeaturedLesson({
        title: lessons[lessonIndex].title,
        content: lessons[lessonIndex].content,
        scenario: lessons[lessonIndex].scenario,
        reflection_question: lessons[lessonIndex].reflection_question,
        practice_prompt: lessons[lessonIndex].practice_prompt
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-2 border-yellow-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!featuredLesson) {
    return null;
  }

  // Truncate content for preview
  const previewContent = featuredLesson.content.length > 200
    ? featuredLesson.content.substring(0, 200) + "..."
    : featuredLesson.content;

  return (
    <Card className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-2 border-yellow-500/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl -z-10" />

      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Badge and Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                Fresh from Solace This Week
              </Badge>
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-orange-600" />
              {featuredLesson.title}
            </h3>

            <p className="text-muted-foreground mb-4 leading-relaxed">
              {previewContent}
            </p>

            {featuredLesson.scenario && (
              <div className="bg-background/80 backdrop-blur rounded-lg p-4 mb-4 border border-yellow-500/30">
                <p className="text-sm font-semibold text-foreground mb-1">Practice Scenario:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {featuredLesson.scenario}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/mini-lessons")}
                className="gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                Start This Lesson
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/mini-lessons")}
                className="gap-2 border-yellow-600/50 hover:bg-yellow-500/10"
              >
                <BookOpen className="h-4 w-4" />
                View All Lessons
              </Button>
            </div>
          </div>

          {/* Stats/Info Section */}
          <div className="md:w-64 flex md:flex-col gap-3">
            <div className="flex-1 bg-background/80 backdrop-blur rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Interactive</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Hands-on practice with real scenarios
              </p>
            </div>

            <div className="flex-1 bg-background/80 backdrop-blur rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Self-Paced</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Learn at your own speed and schedule
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
