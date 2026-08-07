import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { verificationId } = await req.json();
    console.log("Processing verification email for ID:", verificationId);

    // Get verification record
    const { data: verification, error: verificationError } = await supabase
      .from('professional_email_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (verificationError || !verification) {
      console.error("Verification not found:", verificationError);
      throw new Error("Verification not found");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, first_name')
      .eq('user_id', verification.user_id)
      .single();

    const userName = profile?.display_name || profile?.first_name || "there";
    const verificationUrl = `${SUPABASE_URL?.replace('/functions/v1', '')}/verify-professional?token=${verification.token}`;

    console.log("Sending verification email to:", verification.professional_email);

    // Send verification email using fetch to Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "BridgePoint <onboarding@resend.dev>",
        to: [verification.professional_email],
        subject: "Verify Your Professional Email - BridgePoint",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Verify Your Professional Email</h1>
            <p>Hi ${userName},</p>
            <p>Thank you for requesting Professional Mode access on BridgePoint.</p>
            <p>To verify your professional email address and complete your request, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 7 days. If you didn't request this verification, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              <strong>What is Professional Mode?</strong><br>
              Professional Mode is designed for case managers, social workers, peer support specialists,
              and other helping professionals. It provides tools to build resource bundles, prepare scripts,
              and organize navigation tools.
            </p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error('Failed to send email');
    }

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-professional-verification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
