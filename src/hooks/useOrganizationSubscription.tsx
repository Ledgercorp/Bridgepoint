import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSubscriptionStatus {
  hasSubscription: boolean;
  organizationId: string | null;
  organizationName: string | null;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  isAdmin: boolean;
  seats: number | null;
  message: string | null;
  loading: boolean;
}

export const useOrganizationSubscription = () => {
  const [status, setStatus] = useState<OrganizationSubscriptionStatus>({
    hasSubscription: false,
    organizationId: null,
    organizationName: null,
    subscriptionStatus: null,
    subscriptionEnd: null,
    isAdmin: false,
    seats: null,
    message: null,
    loading: true,
  });
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus({
          hasSubscription: false,
          organizationId: null,
          organizationName: null,
          subscriptionStatus: null,
          subscriptionEnd: null,
          isAdmin: false,
          seats: null,
          message: 'Not authenticated',
          loading: false,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-organization-subscription');

      if (error) {
        console.error('Error checking organization subscription:', error);
        throw error;
      }

      setStatus({
        hasSubscription: data.hasSubscription || false,
        organizationId: data.organizationId || null,
        organizationName: data.organizationName || null,
        subscriptionStatus: data.subscriptionStatus || null,
        subscriptionEnd: data.subscriptionEnd || null,
        isAdmin: data.isAdmin || false,
        seats: data.seats || null,
        message: data.message || null,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to check organization subscription:', error);
      setStatus({
        hasSubscription: false,
        organizationId: null,
        organizationName: null,
        subscriptionStatus: null,
        subscriptionEnd: null,
        isAdmin: false,
        seats: null,
        message: 'Error checking subscription',
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkSubscription();

    // Refresh subscription status every 2 minutes
    const interval = setInterval(checkSubscription, 120000);

    // Check subscription on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSubscription();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...status,
    refreshSubscription: checkSubscription,
  };
};
