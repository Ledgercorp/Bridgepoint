import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export function SolacePersonalization() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <CardTitle>Solace Settings</CardTitle>
        </div>
        <CardDescription>Customize how your guide responds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tone">Response Tone</Label>
          <Select defaultValue="balanced">
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Professional & Formal</SelectItem>
              <SelectItem value="balanced">Balanced & Supportive</SelectItem>
              <SelectItem value="friendly">Warm & Conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cultural-humility">Cultural Humility Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enhanced awareness of diverse backgrounds
            </p>
          </div>
          <Switch id="cultural-humility" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="trauma-informed">Trauma-Informed Language</Label>
            <p className="text-sm text-muted-foreground">
              Emphasize safety and empowerment
            </p>
          </div>
          <Switch id="trauma-informed" defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}