import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LearningNotes() {
  return (
    <div className="space-y-4">
      <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          Educational Use Only
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Learning notes are for coursework only. Never enter client-identifying information or personal details.
        </AlertDescription>
      </Alert>

      <div className="text-center py-12 text-muted-foreground">
        <p>Learning notes feature coming soon</p>
      </div>
    </div>
  );
}