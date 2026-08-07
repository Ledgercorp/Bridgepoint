import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SubscriptionRequiredBannerProps {
  organizationName: string;
  isAdmin: boolean;
  subscriptionStatus: string | null;
}

export const SubscriptionRequiredBanner = ({
  organizationName,
  isAdmin,
  subscriptionStatus
}: SubscriptionRequiredBannerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-organization-checkout');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Complete the subscription to unlock all Professional Mode features",
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'not_subscribed':
        return 'This organization does not have an active subscription.';
      case 'canceled':
      case 'incomplete_expired':
      case 'past_due':
        return 'This organization\'s subscription has lapsed.';
      case 'no_organization':
        return 'You must be part of an organization to access Professional Mode.';
      default:
        return 'Professional Mode requires an active subscription.';
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Subscription Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{getStatusMessage()}</p>
        <p className="text-sm">
          Professional Mode is exclusively available to verified organizations with active subscriptions.
          {organizationName && ` ${organizationName} `}
          must maintain an active subscription to access advanced organizational features.
        </p>
        {isAdmin && subscriptionStatus !== 'no_organization' && (
          <div className="mt-4">
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {loading ? 'Processing...' : subscriptionStatus === 'not_subscribed' ? 'Subscribe Now - $99/month' : 'Renew Subscription'}
            </Button>
          </div>
        )}
        {!isAdmin && subscriptionStatus !== 'no_organization' && (
          <p className="text-sm font-medium">
            Please contact your organization administrator to renew the subscription.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
