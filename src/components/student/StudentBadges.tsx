import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

const badges = [
  { name: "Resource Explorer", description: "Explored 10+ resources", earned: false },
  { name: "Ethics First", description: "Reviewed privacy guidelines", earned: false },
  { name: "Kit Builder", description: "Created 3 resource kits", earned: false },
  { name: "Note Taker", description: "Added 10 learning notes", earned: false },
];

export function StudentBadges() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <CardTitle>Student Badges</CardTitle>
        </div>
        <CardDescription>Track your learning milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                badge.earned ? "bg-primary/5 border-primary/20" : "bg-muted/30"
              }`}
            >
              <div>
                <p className={`font-medium ${!badge.earned && "text-muted-foreground"}`}>
                  {badge.name}
                </p>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
              {badge.earned ? (
                <Badge variant="secondary">Earned</Badge>
              ) : (
                <Badge variant="outline">Locked</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}