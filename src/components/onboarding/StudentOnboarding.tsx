import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, AlertCircle, Heart } from "lucide-react";

interface StudentOnboardingProps {
  onComplete: () => void;
}

export function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <GraduationCap className="w-16 h-16 text-primary" />,
      title: "Welcome to Student Mode",
      description: "Student Mode is designed for Human Services students and requires a verified .edu email address."
    },
    {
      icon: <BookOpen className="w-16 h-16 text-primary" />,
      title: "Learning Tools Included",
      description: "Create Resource Kits for assignments, add learning notes, and track your educational progress."
    },
    {
      icon: <AlertCircle className="w-16 h-16 text-primary" />,
      title: "Educational Use Only",
      description: "Student Mode is for coursework. Never enter client-identifying information in notes or kits."
    },
    {
      icon: <Heart className="w-16 h-16 text-primary" />,
      title: "Trauma-Informed Support",
      description: "Solace — your guide inside BridgePoint — uses culturally humble, trauma-informed language in all responses."
    }
  ];

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentScreen = screens[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {currentScreen.icon}
          </div>
          <CardTitle className="text-2xl">{currentScreen.title}</CardTitle>
          <CardDescription className="text-base">
            {currentScreen.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-2">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext} className="w-full">
            {step < screens.length - 1 ? "Next" : "Go to Student Home"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}