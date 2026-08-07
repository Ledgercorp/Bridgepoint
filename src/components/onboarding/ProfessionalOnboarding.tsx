import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Package, AlertTriangle } from "lucide-react";

interface ProfessionalOnboardingProps {
  onComplete: () => void;
}

export function ProfessionalOnboarding({ onComplete }: ProfessionalOnboardingProps) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <Briefcase className="w-16 h-16 text-primary" />,
      title: "Welcome to Professional Mode",
      description: "This mode is designed for case managers, peer supporters, housing navigators, and other helping professionals. It gives you tools to find resources quickly, build reusable bundles, and prepare scripts and checklists."
    },
    {
      icon: <Package className="w-16 h-16 text-primary" />,
      title: "What You Can Do Here",
      description: (
        <ul className="text-left space-y-2 mx-auto max-w-md">
          <li>• Create resource bundles to share with clients</li>
          <li>• Use Solace to explain complex systems</li>
          <li>• Save frequently used resources and tools</li>
          <li>• Prepare appointment scripts and checklists</li>
          <li>• Access professional shortcuts for common needs</li>
        </ul>
      )
    },
    {
      icon: <AlertTriangle className="w-16 h-16 text-amber-600" />,
      title: "What You Should NOT Do",
      description: (
        <ul className="text-left space-y-2 mx-auto max-w-md text-amber-700 dark:text-amber-400">
          <li>✗ Do not enter client names or identifying information</li>
          <li>✗ Do not use this app for clinical documentation</li>
          <li>✗ Do not expect clinical, legal, or medical advice</li>
          <li>✗ Do not store personal health or case information</li>
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
                index === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <Button onClick={handleNext} className="w-full">
          {step < screens.length - 1 ? "Next" : "Enter Professional Mode"}
        </Button>
      </CardContent>
    </Card>
  );
}
