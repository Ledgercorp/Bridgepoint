import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Eye, Shield } from "lucide-react";

interface InstructorOnboardingProps {
  onComplete: () => void;
}

export function InstructorOnboarding({ onComplete }: InstructorOnboardingProps) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <GraduationCap className="w-16 h-16 text-purple-600" />,
      title: "Welcome to Instructor Mode",
      description: "This mode lets you explore how students and professionals will use BridgePoint, without exposing any individual user data. Use it to understand the platform and plan curriculum integration."
    },
    {
      icon: <Eye className="w-16 h-16 text-purple-600" />,
      title: "What You Can See",
      description: (
        <ul className="text-left space-y-2 mx-auto max-w-md">
          <li>• Student Mode feature previews</li>
          <li>• Mini-lessons and practice scenarios</li>
          <li>• Resource Kits and learning tools</li>
          <li>• How Solace guides students</li>
          <li>• Study Rooms and collaborative features</li>
        </ul>
      )
    },
    {
      icon: <Shield className="w-16 h-16 text-purple-600" />,
      title: "Privacy and Boundaries",
      description: (
        <ul className="text-left space-y-2 mx-auto max-w-md text-purple-700 dark:text-purple-400">
          <li>✓ No student identities or personal information</li>
          <li>✓ No access to individual activity logs</li>
          <li>✓ Only generic, educational previews</li>
          <li>✓ Privacy-first by design</li>
        </ul>
      )
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
    <Card className="w-full">
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
                index === step ? "bg-purple-600" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <Button onClick={handleNext} className="w-full bg-purple-600 hover:bg-purple-700">
          {step < screens.length - 1 ? "Next" : "Enter Instructor Mode"}
        </Button>
      </CardContent>
    </Card>
  );
}
