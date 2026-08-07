import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  eduEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { eduEmail }: VerificationRequest = await req.json();

    // Validate .edu email
    if (!eduEmail || !eduEmail.toLowerCase().endsWith(".edu")) {
      return new Response(
        JSON.stringify({ error: "Student Mode requires a .edu email address." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate verification token
    const token_str = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    // Store verification token
    const { error: insertError } = await supabase
      .from("edu_email_verifications")
      .insert({
        user_id: user.id,
        edu_email: eduEmail.toLowerCase(),
        token: token_str,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get app URL for verification link
    const appUrl = req.headers.get("origin") || "http://localhost:8080";
    const verificationLink = `${appUrl}/verify-edu?token=${token_str}`;

    // TESTING MODE: Send to user's main email instead of .edu email
    // This bypasses Resend's domain verification requirement for testing
    const testMode = true;
    const recipientEmail = testMode ? user.email! : eduEmail;

    // Send verification email
    try {
      const emailResponse = await resend.emails.send({
        from: "Solace Resources <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: testMode ? "[TEST MODE] Verify Your .edu Email for Student Mode" : "Verify Your .edu Email for Student Mode",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${testMode ? `
              <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #856404; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">🧪 TEST MODE</p>
                <p style="color: #856404; font-size: 13px; line-height: 1.4; margin: 0;">
                  This email was sent to <strong>${user.email}</strong> instead of ${eduEmail} for testing purposes.
                  In production, the verification email would be sent directly to your .edu address.
                </p>
              </div>
            ` : ''}

            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Verify Your Student Email</h1>

            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              You requested to verify <strong>${eduEmail}</strong> to upgrade your Solace Resources account to Student Mode. Student Mode provides educational tools for learners in Human Services, Social Work, Counseling, Peer Support, and related programs.
            </p>

            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Click the button below to verify your .edu email address and activate Student Mode:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Verify Email & Activate Student Mode
              </a>
            </div>

            <p style="color: #777; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #2563eb; word-break: break-all;">${verificationLink}</a>
            </p>

            <p style="color: #777; font-size: 14px; line-height: 1.5; margin-top: 20px;">
              This link will expire in 24 hours.
            </p>

            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; line-height: 1.5;">
                <strong>Important Reminder:</strong> Student Mode is for educational use only. Do NOT enter client-identifying information.
              </p>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              If you didn't request this verification, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      console.log("Verification email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          testMode,
          sentTo: recipientEmail,
          eduEmail: eduEmail,
          message: testMode
            ? `Test mode: Verification email sent to ${recipientEmail} instead of ${eduEmail}. Check your inbox!`
            : "Verification email sent! Please check your inbox."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      // Check if it's a Resend domain verification error (403 or validation_error)
      if (emailError.statusCode === 403 || emailError.name === "validation_error") {
        return new Response(
          JSON.stringify({
            error: "Email sending is in test mode. To send verification emails to .edu addresses, you need to verify your domain at resend.com/domains.",
            resendError: emailError.message
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to send verification email. Please try again or contact support.",
          details: emailError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in send-edu-verification function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process verification request",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
