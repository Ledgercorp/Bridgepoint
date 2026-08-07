import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEdu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        // First, fetch the verification record
        const { data: verification, error: fetchError } = await supabase
          .from("edu_email_verifications")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (fetchError || !verification) {
          setStatus("error");
          setMessage("Invalid or expired verification link.");
          return;
        }

        // Check if already verified
        if (verification.verified) {
          setStatus("error");
          setMessage("This verification link has already been used.");
          return;
        }

        // Check if expired
        const expiresAt = new Date(verification.expires_at);
        if (expiresAt < new Date()) {
          setStatus("error");
          setMessage("This verification link has expired. Please request a new one.");
          return;
        }

        // Mark as verified
        const { error: updateVerifyError } = await supabase
          .from("edu_email_verifications")
          .update({ verified: true })
          .eq("token", token);

        if (updateVerifyError) {
          throw updateVerifyError;
        }

        // Update user profile
        const { error: updateProfileError } = await supabase
          .from("user_profiles")
          .update({
            is_edu_verified: true,
            current_mode: "student",
            edu_email: verification.edu_email,
          })
          .eq("user_id", verification.user_id);

        if (updateProfileError) {
          throw updateProfileError;
        }

        // Fetch updated profile to get display name
        const { data: updatedProfile } = await supabase
          .from("user_profiles")
          .select("email, display_name")
          .eq("user_id", verification.user_id)
          .maybeSingle();

        // Send welcome email (don't block on this)
        supabase.functions
          .invoke("send-student-welcome", {
            body: {
              email: verification.edu_email,
              displayName: updatedProfile?.display_name || undefined
            },
          })
          .then(({ error: emailError }) => {
            if (emailError) {
              console.error("Failed to send welcome email:", emailError);
            }
          });

        setStatus("success");
        setMessage("Your .edu email has been verified! Student Mode is now activated. Check your inbox for a welcome email with feature details.");
        toast.success("Welcome to Student Mode!");

        // Redirect to profile after 3 seconds
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Home">
          <Home className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "verifying" && (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            )}
            {status === "success" && (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "verifying" && "Verifying Your Email"}
            {status === "success" && "Verification Successful!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="mt-2">
            {status === "verifying" && "Please wait while we verify your .edu email address..."}
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "success" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Redirecting you to your profile...
              </p>
            </div>
          )}
          {status === "error" && (
            <Button onClick={() => navigate("/profile")} className="w-full">
              Go to Profile
            </Button>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
