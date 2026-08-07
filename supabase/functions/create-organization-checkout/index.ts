import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ORG-CHECKOUT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's organization membership (must be admin)
    const { data: membership, error: membershipError } = await supabaseClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) {
      throw new Error("User must be an organization admin to manage subscriptions");
    }

    logStep("Admin membership verified", { orgId: membership.organization_id });

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, email, stripe_customer_id')
      .eq('id', membership.organization_id)
      .single();

    if (orgError) throw orgError;
    logStep("Organization found", { orgName: organization.name });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil"
    });

    // Professional Organization Plan - $99/month, 10 seats included
    const priceId = "price_1SYbr1GxlO3tKde2R3GNlJ8d";

    // Check if organization already has a Stripe customer
    let customerId = organization.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer for the organization
      logStep("Creating new Stripe customer for organization");
      const customer = await stripe.customers.create({
        email: organization.email || user.email,
        name: organization.name,
        metadata: {
          organization_id: organization.id,
          organization_name: organization.name,
        }
      });
      customerId = customer.id;

      // Update organization with Stripe customer ID
      await supabaseClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organization.id);

      logStep("Stripe customer created", { customerId });
    } else {
      logStep("Using existing Stripe customer", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/professional-home?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/professional-home?subscription=cancelled`,
      metadata: {
        organization_id: organization.id,
      },
      subscription_data: {
        metadata: {
          organization_id: organization.id,
          organization_name: organization.name,
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-organization-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
