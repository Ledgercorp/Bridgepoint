import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    const { organizationId, email, role } = await req.json();

    // Verify user is admin of the organization
    const { data: membership, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(JSON.stringify({
        error: "Only organization admins can send invitations"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('organization_members')
      .select('id, user_profiles!inner(email)')
      .eq('organization_id', organizationId);

    const alreadyMember = existingMember?.some(
      (m) => m.user_profiles?.email === email
    );

    if (alreadyMember) {
      return new Response(JSON.stringify({
        error: "User is already a member of this organization"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) throw orgError;

    // Generate invite token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite
    const { error: inviteError } = await supabaseClient
      .from('organization_invites')
      .insert({
        organization_id: organizationId,
        email,
        role: role || 'member',
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) throw inviteError;

    // Send email via Resend
    if (RESEND_API_KEY) {
      const inviteUrl = `${req.headers.get("origin")}/accept-invite?token=${token}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "BridgePoint <noreply@bridgepoint.app>",
          to: [email],
          subject: `Invitation to join ${org.name} on BridgePoint`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">You've been invited!</h1>
              <p>You've been invited to join <strong>${org.name}</strong> on BridgePoint as a ${role || 'member'}.</p>
              <p>Click the button below to accept your invitation:</p>
              <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
              <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
              <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Invitation sent successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending invite:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
