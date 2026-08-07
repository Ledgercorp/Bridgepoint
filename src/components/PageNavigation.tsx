import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface PageNavigationProps {
  showBack?: boolean;
  showHome?: boolean;
  className?: string;
}

export const PageNavigation = ({
  showBack = true,
  showHome = true,
  className = ""
}: PageNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      )}
    </div>
  );
};
