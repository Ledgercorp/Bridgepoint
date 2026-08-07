import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceName: string;
}

const REPORT_REASONS = [
  { value: "closed", label: "Business is closed" },
  { value: "wrong_hours", label: "Wrong hours listed" },
  { value: "phone_not_working", label: "Phone doesn't work" },
  { value: "website_down", label: "Website is down" },
  { value: "wrong_address", label: "Wrong address" },
  { value: "other", label: "Other issue" },
];

export const ReportResourceDialog = ({
  open,
  onOpenChange,
  resourceId,
  resourceName,
}: ReportResourceDialogProps) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        variant: "destructive",
        title: "Please select a reason",
        description: "Select why you're reporting this resource.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert the report
      const { error: reportError } = await supabase
        .from("resource_reports")
        .insert({
          resource_id: resourceId,
          reason,
          comment: comment.trim() || null,
        });

      if (reportError) throw reportError;

      // Get current report count
      const { data: currentResource } = await supabase
        .from("resources")
        .select("report_count")
        .eq("id", resourceId)
        .maybeSingle();

      // Update the resource flags
      const { error: updateError } = await supabase
        .from("resources")
        .update({
          needs_review: true,
          report_count: (currentResource?.report_count || 0) + 1,
          last_reported_at: new Date().toISOString(),
        })
        .eq("id", resourceId);

      if (updateError) throw updateError;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our resource information accurate.",
      });

      // Reset form and close
      setReason("");
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "Failed to Submit Report",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warm" />
            Report Outdated Information
          </DialogTitle>
          <DialogDescription>
            Help us keep <strong>{resourceName}</strong> information accurate by reporting any issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">What's the issue?</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Additional details (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Provide any additional information that might help..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 characters
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Privacy Notice:</strong> No personal information is collected with this report.
              This is completely anonymous.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};