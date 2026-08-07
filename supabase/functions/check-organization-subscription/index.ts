import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ORG-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      logStep("Error fetching membership", { error: membershipError.message });
      throw membershipError;
    }

    if (!membership) {
      logStep("No organization membership found");
      return new Response(JSON.stringify({
        hasSubscription: false,
        organizationId: null,
        subscriptionStatus: 'no_organization',
        message: 'User is not part of any organization'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Organization membership found", { orgId: membership.organization_id, role: membership.role });

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, stripe_subscription_id, stripe_customer_id, subscription_status, subscription_seats')
      .eq('id', membership.organization_id)
      .single();

    if (orgError) {
      logStep("Error fetching organization", { error: orgError.message });
      throw orgError;
    }

    logStep("Organization found", {
      orgId: organization.id,
      subscriptionStatus: organization.subscription_status,
      stripeSubId: organization.stripe_subscription_id
    });

    // If no Stripe subscription ID, organization hasn't subscribed
    if (!organization.stripe_subscription_id) {
      logStep("No Stripe subscription ID found");
      return new Response(JSON.stringify({
        hasSubscription: false,
        organizationId: organization.id,
        organizationName: organization.name,
        subscriptionStatus: 'not_subscribed',
        isAdmin: membership.role === 'admin',
        message: 'Organization has not subscribed yet'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check subscription status with Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    try {
      const subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id);
      logStep("Stripe subscription retrieved", {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      });

      const isActive = ['active', 'trialing'].includes(subscription.status);
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Update organization subscription status if it doesn't match
      if (organization.subscription_status !== subscription.status) {
        logStep("Updating organization subscription status", {
          oldStatus: organization.subscription_status,
          newStatus: subscription.status
        });

        await supabaseClient
          .from('organizations')
          .update({ subscription_status: subscription.status })
          .eq('id', organization.id);
      }

      return new Response(JSON.stringify({
        hasSubscription: isActive,
        organizationId: organization.id,
        organizationName: organization.name,
        subscriptionStatus: subscription.status,
        subscriptionEnd,
        isAdmin: membership.role === 'admin',
        seats: organization.subscription_seats,
        message: isActive ? 'Organization subscription is active' : 'Organization subscription is not active'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (stripeError) {
      logStep("Stripe API error", { error: stripeError.message });

      // If subscription not found in Stripe, mark as inactive
      if (stripeError.code === 'resource_missing') {
        await supabaseClient
          .from('organizations')
          .update({ subscription_status: 'inactive' })
          .eq('id', organization.id);

        return new Response(JSON.stringify({
          hasSubscription: false,
          organizationId: organization.id,
          organizationName: organization.name,
          subscriptionStatus: 'inactive',
          isAdmin: membership.role === 'admin',
          message: 'Subscription not found in Stripe'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      throw stripeError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-organization-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
