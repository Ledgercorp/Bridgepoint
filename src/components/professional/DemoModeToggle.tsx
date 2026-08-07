import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Info } from "lucide-react";

interface DemoModeToggleProps {
  onStartDemo: () => void;
}

export function DemoModeToggle({ onStartDemo }: DemoModeToggleProps) {
  return (
    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Try Demo Mode
        </CardTitle>
        <CardDescription>
          Explore Professional Mode features with sample data before setting up your real organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-purple-900 dark:text-purple-100">What you'll explore:</p>
              <ul className="text-muted-foreground space-y-1 ml-4">
                <li>• Sample organization dashboard</li>
                <li>• Pre-populated team members</li>
                <li>• Example resource bundles</li>
                <li>• Organization management tools</li>
                <li>• Member invitation workflow</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={onStartDemo}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Interactive Demo
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Demo mode uses sample data only. Your real organization data remains separate.
        </p>
      </CardContent>
    </Card>
  );
}
