import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, MessageSquare, Shield } from "lucide-react";

interface CommunityOnboardingProps {
  onComplete: () => void;
}

export function CommunityOnboarding({ onComplete }: CommunityOnboardingProps) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <Home className="w-16 h-16 text-primary" />,
      title: "Find Resources Near You",
      description: "BridgePoint helps you find housing, food, transportation, legal aid, and other community support."
    },
    {
      icon: <MessageSquare className="w-16 h-16 text-primary" />,
      title: "Meet Solace — Your Guide",
      description: "Solace is your built-in guide. Ask questions, get clear answers, and find what you need."
    },
    {
      icon: <Shield className="w-16 h-16 text-primary" />,
      title: "Your Privacy Matters",
      description: "BridgePoint does not store personal or client information. All guidance is general only."
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
      <Card className="w-full max-w-md">
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
            {step < screens.length - 1 ? "Next" : "Get Started"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}