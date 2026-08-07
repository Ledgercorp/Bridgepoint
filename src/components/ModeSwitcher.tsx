import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Briefcase, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserMode } from "@/hooks/useUserMode";

interface ModeSwitcherProps {
  currentMode: UserMode;
  isEduVerified: boolean;
  isProfessionalVerified: boolean;
  isInstructorVerified: boolean;
  isAdmin?: boolean;
  onModeChange: (mode: UserMode) => Promise<boolean>;
  variant?: "badge" | "button";
}

export function ModeSwitcher({
  currentMode,
  isEduVerified,
  isProfessionalVerified,
  isInstructorVerified,
  isAdmin = false,
  onModeChange,
  variant = "badge",
}: ModeSwitcherProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const getModeIcon = (mode: UserMode) => {
    switch (mode) {
      case "student":
        return <GraduationCap className="w-3 h-3" />;
      case "professional":
        return <Briefcase className="w-3 h-3" />;
      case "instructor":
        return <GraduationCap className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getModeLabel = (mode: UserMode) => {
    switch (mode) {
      case "student":
        return "Student Mode";
      case "professional":
        return "Professional Mode (Organization Access)";
      case "instructor":
        return "Instructor Mode";
      default:
        return "Community Mode";
    }
  };

  const handleModeSwitch = async (newMode: UserMode) => {
    if (newMode === currentMode) {
      return;
    }

    setSwitching(true);

    const success = await onModeChange(newMode);

    if (success) {
      toast({
        title: "Mode Changed",
        description: `Switched to ${getModeLabel(newMode)}`,
      });

      // Navigate immediately to the correct home for the new mode
      if (newMode === "student") {
        navigate("/student-home");
      } else if (newMode === "community") {
        navigate("/community-home");
      } else if (newMode === "professional") {
        navigate("/professional-home");
      } else if (newMode === "instructor") {
        navigate("/instructor-home");
      }
    } else {
      toast({
        title: "Unable to Switch",
        description: "You don't have access to this mode.",
        variant: "destructive",
      });
    }
    setSwitching(false);
  };

  // Determine available modes
  const availableModes: UserMode[] = ["community"];

  // Admins get all modes
  if (isAdmin) {
    availableModes.push("student", "professional", "instructor");
  } else {
    if (isEduVerified) availableModes.push("student");
    if (isProfessionalVerified) availableModes.push("professional");
    if (isInstructorVerified) availableModes.push("instructor");
  }

  // If only one mode is available, show it without dropdown
  if (availableModes.length === 1) {
    if (variant === "badge") {
      return (
        <Badge
          variant="secondary"
          className="gap-1"
        >
          {getModeIcon(currentMode)}
          {getModeLabel(currentMode)}
        </Badge>
      );
    }
    return (
      <Button variant="outline" size="sm">
        {getModeIcon(currentMode)}
        {getModeLabel(currentMode)}
      </Button>
    );
  }

  // If multiple modes available, show dropdown
  if (variant === "badge") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="secondary"
            className="gap-1 cursor-pointer hover:bg-secondary/80"
          >
            {getModeIcon(currentMode)}
            {getModeLabel(currentMode)}
            <ChevronDown className="w-3 h-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-2 border-border shadow-lg">
          {availableModes.map((mode) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => handleModeSwitch(mode)}
              disabled={switching || mode === currentMode}
              className="gap-2 hover:bg-accent cursor-pointer"
            >
              {getModeIcon(mode)}
              {getModeLabel(mode)}
              {mode === currentMode && " (current)"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={switching} className="gap-2">
          {getModeIcon(currentMode)}
          {getModeLabel(currentMode)}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-2 border-border shadow-lg">
        {availableModes.map((mode) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => handleModeSwitch(mode)}
            disabled={switching || mode === currentMode}
            className="gap-2 hover:bg-accent cursor-pointer"
          >
            {getModeIcon(mode)}
            {getModeLabel(mode)}
            {mode === currentMode && " (current)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
