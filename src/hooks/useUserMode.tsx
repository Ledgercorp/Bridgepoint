import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserMode = "community" | "student" | "professional" | "instructor";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  home_location: string | null;
  home_location_type: 'zip' | 'city_state' | 'coordinates' | null;
  is_edu_verified: boolean;
  is_professional_verified: boolean;
  is_instructor_verified: boolean;
  professional_email: string | null;
  professional_role: string | null;
  current_mode: UserMode;
  has_completed_onboarding: boolean;
  preferences: {
    theme?: string;
    fontSize?: string;
    zipCode?: string | null;
    solaceTone?: string;
    culturalHumility?: boolean;
    audioReadEnabled?: boolean;
    voiceInputEnabled?: boolean;
    remindersEnabled?: boolean;
    [key: string]: unknown;
  } | null;
}

export function useUserMode() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Load profile and admin status in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;

      const adminStatus = !!roleResult.data;

      // Set both at the same time to avoid race condition
      setProfile(profileResult.data as UserProfile);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMode = async (mode: UserMode) => {
    if (!user || !profile) {
      return false;
    }

    // Admins can switch to any mode without verification
    if (!isAdmin) {
      // Only allow student mode if edu verified
      if (mode === "student" && !profile.is_edu_verified) {
        return false;
      }

      // Professional mode requires organizational verification, organization membership, AND active subscription
      if (mode === "professional") {
        if (!profile.is_professional_verified) {
          return false;
        }

        // Check if user is part of an organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          return false;
        }

        // Check if organization has active subscription
        const { data: subscriptionData } = await supabase.functions.invoke('check-organization-subscription');

        if (!subscriptionData?.hasSubscription) {
          return false;
        }
      }

      // Only allow instructor mode if instructor verified
      if (mode === "instructor" && !profile.is_instructor_verified) {
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ current_mode: mode })
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      setProfile({ ...profile, current_mode: mode });
      return true;
    } catch (error) {
      console.error("Error updating mode:", error);
      return false;
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ has_completed_onboarding: true })
        .eq("user_id", user.id);

      if (error) throw error;

      if (profile) {
        setProfile({ ...profile, has_completed_onboarding: true });
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      if (profile) {
        setProfile({ ...profile, ...updates });
      }
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  return {
    user,
    profile,
    loading,
    isAdmin,
    isEduVerified: profile?.is_edu_verified || false,
    isProfessionalVerified: profile?.is_professional_verified || false,
    isInstructorVerified: profile?.is_instructor_verified || false,
    currentMode: profile?.current_mode || "community",
    hasCompletedOnboarding: profile?.has_completed_onboarding || false,
    updateMode,
    completeOnboarding,
    updateProfile,
    refreshProfile: () => user && loadProfile(user.id),
  };
}
