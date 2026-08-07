import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Zap, GraduationCap, Smile, Check } from "lucide-react";

interface SolacePersonalityProps {
  currentPersonality: string;
  onPersonalityChange: (personality: string) => void;
}

const personalities = [
  {
    id: "empathetic",
    name: "Empathetic",
    icon: Heart,
    description: "Warm, understanding, and supportive. Perfect for emotional topics and difficult situations.",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
  },
  {
    id: "practical",
    name: "Practical",
    icon: Zap,
    description: "Direct, efficient, and action-oriented. Best for getting quick answers and step-by-step guidance.",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    description: "Detailed, thorough, and educational. Ideal for learning and understanding complex topics.",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "cheerful",
    name: "Cheerful",
    icon: Smile,
    description: "Upbeat, encouraging, and positive. Great for motivation and keeping spirits high.",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
];

export function SolacePersonality({ currentPersonality, onPersonalityChange }: SolacePersonalityProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handlePersonalitySelect = async (personalityId: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_profiles")
        .update({ solace_personality: personalityId })
        .eq("user_id", user.id);

      if (error) throw error;

      onPersonalityChange(personalityId);

      const personality = personalities.find(p => p.id === personalityId);
      toast({
        title: "Personality Updated",
        description: `Solace is now in ${personality?.name} mode`,
      });
    } catch (error) {
      console.error("Error updating personality:", error);
      toast({
        title: "Error",
        description: "Unable to update personality",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solace Personality</CardTitle>
        <CardDescription>
          Choose how Solace communicates with you. You can change this anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {personalities.map((personality) => {
            const Icon = personality.icon;
            const isSelected = currentPersonality === personality.id;

            return (
              <button
                key={personality.id}
                onClick={() => handlePersonalitySelect(personality.id)}
                disabled={saving}
                className={`
                  relative p-4 text-left border-2 rounded-lg transition-all
                  ${isSelected
                    ? `${personality.borderColor} ${personality.bgColor}`
                    : 'border-border hover:border-primary/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${personality.bgColor}`}>
                    <Icon className={`h-5 w-5 ${personality.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{personality.name}</h3>
                      {isSelected && (
                        <Check className={`h-4 w-4 ${personality.color}`} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personality.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
