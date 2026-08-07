import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  organizationName: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, organizationName, status, rejectionReason }: EmailRequest = await req.json();

    if (!to || !organizationName || !status) {
      throw new Error("Missing required fields");
    }

    const subject = status === 'approved'
      ? `✅ ${organizationName} - Organization Verified!`
      : `❌ ${organizationName} - Verification Update`;

    const html = status === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Your Organization Has Been Verified</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${organizationName}</strong> has been successfully verified for Professional Mode access on BridgePoint.
            </p>

            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <h3 style="color: #065f46; margin: 0 0 8px 0; font-size: 16px;">✅ What's Next</h3>
              <ul style="color: #047857; margin: 8px 0; padding-left: 20px;">
                <li>Log in to BridgePoint and navigate to Professional Dashboard</li>
                <li>Complete your organization setup</li>
                <li>Add team members and configure preferences</li>
                <li>Start accessing premium features</li>
              </ul>
            </div>

            <div style="margin: 32px 0;">
              <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('/auth/v1', '')}/professional-dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Complete Organization Setup
              </a>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-top: 24px;">
              <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 14px;">Professional Mode Features Include:</h4>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>AI System Navigator for complex client needs</li>
                <li>Advanced resource bundle management</li>
                <li>Team collaboration tools</li>
                <li>Analytics and insights dashboard</li>
                <li>Priority support</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions? Contact our support team at <a href="mailto:support@bridgepoint.app" style="color: #10b981;">support@bridgepoint.app</a>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 BridgePoint. Empowering organizations to serve communities better.</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verification Update</h1>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Organization Verification Status</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in Professional Mode for <strong>${organizationName}</strong>.
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              After careful review, we're unable to approve your verification request at this time.
            </p>

            ${rejectionReason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 16px;">Reason:</h3>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${rejectionReason}</p>
              </div>
            ` : ''}

            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">💡 What You Can Do</h3>
              <ul style="color: #1e3a8a; margin: 8px 0; padding-left: 20px;">
                <li>Review our verification requirements</li>
                <li>Submit a new request with additional information</li>
                <li>Contact us if you believe this was an error</li>
                <li>Continue using Community Mode features</li>
              </ul>
            </div>

            <div style="margin: 32px 0;">
              <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('/auth/v1', '')}/org-verification-guide"
                 style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Review Verification Requirements
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Have questions? Contact us at <a href="mailto:support@bridgepoint.app" style="color: #3b82f6;">support@bridgepoint.app</a>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 BridgePoint. Empowering organizations to serve communities better.</p>
          </div>
        </div>
      `;

    const { error } = await resend.emails.send({
      from: 'BridgePoint <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in send-org-verification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
