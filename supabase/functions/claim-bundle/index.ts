import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { shareCode } = await req.json();

    // Find the bundle share
    const { data: bundleShare, error: shareError } = await supabaseClient
      .from('bundle_shares')
      .select(`
        id,
        bundle_id,
        share_code,
        expires_at,
        max_claims,
        current_claims,
        is_active,
        resource_bundles (
          id,
          title,
          description,
          resources,
          notes
        )
      `)
      .eq('share_code', shareCode)
      .eq('is_active', true)
      .maybeSingle();

    if (shareError) throw shareError;

    if (!bundleShare) {
      return new Response(JSON.stringify({
        error: "Invalid or expired bundle code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check if expired
    if (bundleShare.expires_at && new Date(bundleShare.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        error: "This bundle code has expired"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if max claims reached
    if (bundleShare.max_claims && bundleShare.current_claims >= bundleShare.max_claims) {
      return new Response(JSON.stringify({
        error: "This bundle code has reached its claim limit"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if already claimed
    const { data: existingClaim } = await supabaseClient
      .from('bundle_claims')
      .select('id')
      .eq('bundle_share_id', bundleShare.id)
      .eq('claimed_by', user.id)
      .maybeSingle();

    if (existingClaim) {
      return new Response(JSON.stringify({
        error: "You have already claimed this bundle",
        bundle: bundleShare.resource_bundles
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create the claim
    const { error: claimError } = await supabaseClient
      .from('bundle_claims')
      .insert({
        bundle_share_id: bundleShare.id,
        claimed_by: user.id,
      });

    if (claimError) throw claimError;

    // Increment the claim count
    const { error: updateError } = await supabaseClient
      .from('bundle_shares')
      .update({ current_claims: bundleShare.current_claims + 1 })
      .eq('id', bundleShare.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      bundle: bundleShare.resource_bundles,
      message: "Bundle claimed successfully!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error claiming bundle:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});