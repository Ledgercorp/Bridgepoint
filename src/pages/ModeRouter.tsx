import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserMode } from "@/hooks/useUserMode";
import { Loader2 } from "lucide-react";

/**
 * ModeRouter - Central routing logic for BridgePoint
 * Redirects users to their appropriate home page based on their current mode
 */
export default function ModeRouter() {
  const navigate = useNavigate();
  const { user, profile, loading, currentMode, isEduVerified, isInstructorVerified, isProfessionalVerified } = useUserMode();

  useEffect(() => {
    if (loading) return;

    // Not logged in - go to auth
    if (!user) {
      navigate("/auth");
      return;
    }

    // Logged in - route to appropriate home
    if (profile) {
      switch (currentMode) {
        case "student":
          if (isEduVerified) {
            navigate("/student-home");
          } else {
            navigate("/community-home");
          }
          break;

        case "instructor":
          if (isInstructorVerified) {
            navigate("/instructor-home");
          } else {
            navigate("/community-home");
          }
          break;

        case "professional":
          if (isProfessionalVerified) {
            navigate("/professional-home");
          } else {
            navigate("/community-home");
          }
          break;

        case "community":
        default:
          navigate("/community-home");
          break;
      }
    }
  }, [user, profile, loading, currentMode, isEduVerified, isInstructorVerified, isProfessionalVerified, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading BridgePoint...</p>
      </div>
    </div>
  );
}
