import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, GraduationCap, Mail } from "lucide-react";

interface UpgradeToStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentVerificationDialog = ({
  open,
  onOpenChange,
}: UpgradeToStudentDialogProps) => {
  const [step, setStep] = useState<"intro" | "email" | "sent">("intro");
  const [eduEmail, setEduEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationResponse, setVerificationResponse] = useState<{
    testMode?: boolean;
    sentTo?: string;
    eduEmail?: string;
  }>({});

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation completes
    setTimeout(() => {
      setStep("intro");
      setEduEmail("");
      setError("");
    }, 200);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.toLowerCase().endsWith(".edu");
  };

  const handleSendVerification = async () => {
    setError("");

    if (!eduEmail.trim()) {
      setError("Please enter your .edu email address.");
      return;
    }

    if (!validateEmail(eduEmail)) {
      setError("Student Mode requires a .edu email address.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Please log in to continue.");
        setLoading(false);
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke(
        "send-edu-verification",
        {
          body: { eduEmail: eduEmail.toLowerCase() },
        }
      );

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Store response data for display
      setVerificationResponse(data || {});
      setStep("sent");

      // Show test mode notice if applicable
      if (data?.testMode) {
        toast.success(
          `🧪 Test Mode: Verification email sent to ${data.sentTo} (your main email) instead of ${data.eduEmail}`,
          { duration: 6000 }
        );
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (err) {
      console.error("Error sending verification:", err);
      setError(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "intro" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <DialogTitle>Verify Student Email</DialogTitle>
              </div>
              <DialogDescription className="text-left space-y-3 pt-2">
                <p>
                  <strong>Student Mode</strong> is for learners in Human Services, Social Work,
                  Counseling, Peer Support, and related programs.
                </p>
                <p>
                  It provides educational tools like:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Resource Kits for organizing learning materials</li>
                  <li>Learning Notes with educational tags</li>
                  <li>Weekly learning summaries</li>
                  <li>Student badges and achievements</li>
                  <li>Solace learning preferences</li>
                </ul>
                <p className="font-semibold">
                  Student Mode requires a verified .edu email address.
                </p>
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Student Mode is for educational use only.
                    Do NOT enter client-identifying information.
                  </AlertDescription>
                </Alert>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("email")}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "email" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-6 w-6 text-primary" />
                <DialogTitle>Enter Your .edu Email</DialogTitle>
              </div>
              <DialogDescription className="text-left">
                We'll send a verification link to your .edu email address to confirm
                your student status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edu-email">.edu Email Address</Label>
                <Input
                  id="edu-email"
                  type="email"
                  placeholder="your.name@university.edu"
                  value={eduEmail}
                  onChange={(e) => {
                    setEduEmail(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep("intro")} disabled={loading}>
                  Back
                </Button>
                <Button onClick={handleSendVerification} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Email
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "sent" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-6 w-6 text-green-600" />
                <DialogTitle>Check Your Email</DialogTitle>
              </div>
              <DialogDescription className="text-left space-y-3 pt-2">
                {verificationResponse.testMode && (
                  <Alert className="mb-4 bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800">
                      <strong>🧪 Test Mode Active:</strong> The verification email was sent to{" "}
                      <strong>{verificationResponse.sentTo}</strong> (your account email) instead of{" "}
                      <strong>{eduEmail}</strong> for testing purposes. This helps bypass email domain verification requirements.
                    </AlertDescription>
                  </Alert>
                )}
                <p>
                  We've sent a verification link to{" "}
                  <strong>
                    {verificationResponse.testMode ? verificationResponse.sentTo : eduEmail}
                  </strong>
                </p>
                <p>
                  Click the link in the email to verify your .edu address and activate Student Mode.
                </p>
                <p className="text-sm text-muted-foreground">
                  The link will expire in 24 hours. If you don't see the email, check your spam folder.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mt-4">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Also export with new name for clarity
export { StudentVerificationDialog as UpgradeToStudentDialog };
