import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export function WeeklySummary() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-primary" />
          <CardTitle>This Week's Learning</CardTitle>
        </div>
        <CardDescription>Your educational progress summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Resources Explored</span>
            <span className="font-bold">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Notes Added</span>
            <span className="font-bold">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kits Created</span>
            <span className="font-bold">0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}