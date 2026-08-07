import { MessageSquare, Search, LogOut, User, GraduationCap, Settings, Heart, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUserMode } from "@/hooks/useUserMode";
import bridgepointLogo from "@/assets/bridgepoint-logo.png";
import solaceAvatar from "@/assets/solace-avatar.png";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { MODE_DEFINITIONS } from "@/config/modeDefinitions";
import { NotificationBell } from "@/components/NotificationBell";

interface HeaderProps {
  onChatClick: () => void;
  onSearchClick: () => void;
}

export const Header = ({ onChatClick, onSearchClick }: HeaderProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentMode, isEduVerified, isProfessionalVerified, isInstructorVerified, isAdmin, updateMode } = useUserMode();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    }
  };

  const getModeHomePath = () => {
    switch (currentMode) {
      case "student": return "/student-home";
      case "instructor": return "/instructor-home";
      case "professional": return "/professional-home";
      case "community":
      default: return "/community-home";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(user ? getModeHomePath() : "/")}
        >
          <img
            src={bridgepointLogo}
            alt="BridgePoint"
            className="h-14 w-auto"
          />
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {currentMode && MODE_DEFINITIONS[currentMode]?.tagline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            title="Go Back"
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(user ? getModeHomePath() : "/")}
            title="Home"
            className="hover:bg-primary/10"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSearchClick} className="hover:bg-primary/10">
            <Search className="w-5 h-5" />
          </Button>
          <NotificationBell userId={user?.id || null} />
          <Button variant="default" size="sm" onClick={onChatClick} className="gap-2">
            <img src={solaceAvatar} alt="Solace" className="w-4 h-4 rounded-full" />
            <span className="hidden sm:inline">Ask Solace</span>
          </Button>
          {user ? (
            <>
              <div className="hidden md:flex">
                <ModeSwitcher
                  currentMode={currentMode}
                  isEduVerified={isEduVerified}
                  isProfessionalVerified={isProfessionalVerified}
                  isInstructorVerified={isInstructorVerified}
                  isAdmin={isAdmin}
                  onModeChange={updateMode}
                  variant="badge"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/my-hub")}
                title="My Hub"
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <User className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
