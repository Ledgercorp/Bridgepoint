import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Crown, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function OrganizationSubscriptionManager() {
  const {
    hasSubscription,
    organizationName,
    subscriptionStatus,
    subscriptionEnd,
    isAdmin,
    seats,
    loading,
    refreshSubscription
  } = useOrganizationSubscription();

  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-organization-checkout');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Complete the subscription to unlock Professional Mode features",
        });
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start checkout process",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('organization-customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to open subscription portal",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isActive = hasSubscription && ['active', 'trialing'].includes(subscriptionStatus || '');

  return (
    <Card className={`border-2 ${isActive ? 'border-emerald-500/30 bg-gradient-to-br from-background to-emerald-500/5' : 'border-border'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full ${isActive ? 'bg-emerald-500/20' : 'bg-muted'} flex items-center justify-center`}>
              <Crown className={`h-6 w-6 ${isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {organizationName || "Organization"} Subscription
                {isActive && (
                  <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isActive
                  ? `Renews ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'monthly'} • ${seats || 10} seats included`
                  : 'Professional Mode requires an active organization subscription'
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive ? (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>All Professional Mode features unlocked</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Team Seats</p>
                <p className="text-xs text-muted-foreground">{seats || 10} staff members can access Professional Mode</p>
              </div>
            </div>

            {isAdmin && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? 'Opening Portal...' : 'Manage Subscription'}
              </Button>
            )}
          </>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {subscriptionStatus === 'no_organization'
                  ? 'You must be part of a verified organization to access Professional Mode.'
                  : subscriptionStatus === 'not_subscribed'
                  ? `${organizationName} does not have an active subscription.`
                  : `${organizationName}'s subscription is ${subscriptionStatus}.`
                }
              </AlertDescription>
            </Alert>

            <div className="grid gap-2 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-semibold">What's included:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Unlimited Resource Bundles
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  AI-Powered Workflow Generator
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Community Navigation Bridge
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Support Threads & Broadcast Tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {seats || 10} Team Seats Included
                </li>
              </ul>
            </div>

            {isAdmin ? (
              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                onClick={handleSubscribe}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Subscribe Now - $99/month
                  </>
                )}
              </Button>
            ) : (
              <Alert>
                <AlertDescription className="text-sm">
                  Only organization administrators can manage subscriptions. Please contact your organization admin.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          All subscriptions are billed monthly. Cancel anytime.
        </p>
      </CardContent>
    </Card>
  );
}
