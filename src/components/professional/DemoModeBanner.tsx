import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface DemoModeBannerProps {
  onExitDemo: () => void;
}

export function DemoModeBanner({ onExitDemo }: DemoModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <Sparkles className="h-4 w-4 text-purple-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong className="text-purple-900 dark:text-purple-100">Demo Mode Active</strong>
          <p className="mt-1 text-sm text-purple-800 dark:text-purple-200">
            You're exploring Professional Mode with sample data. None of the information shown is real.
            Changes won't be saved.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onExitDemo}
            className="border-purple-500/50 hover:bg-purple-500/20"
          >
            Exit Demo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="hover:bg-purple-500/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
