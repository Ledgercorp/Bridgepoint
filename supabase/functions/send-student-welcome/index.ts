import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const appUrl = req.headers.get("origin") || "http://localhost:8080";
    const name = displayName || "Student";

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Solace Resources <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Student Mode! 🎓",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 32px; margin-bottom: 10px;">🎓 Welcome to Student Mode!</h1>
            <p style="color: #555; font-size: 18px;">Your .edu email has been verified</p>
          </div>

          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hi ${name},
          </p>

          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Congratulations! Your student status has been verified and Student Mode is now active.
            You now have access to powerful educational tools designed specifically for learners in Human Services,
            Social Work, Counseling, Peer Support, and related programs.
          </p>

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 15px;">Your New Student Features:</h2>

            <div style="margin-bottom: 15px;">
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 5px 0;">📚 Resource Kits</h3>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                Organize and curate community resources into custom collections. Perfect for class projects, field placements, or building your professional resource library.
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 5px 0;">✍️ Learning Notes</h3>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                Take educational notes on resources with tags and context. Track your learning journey and document insights for future reference.
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 5px 0;">📊 Weekly Learning Summary</h3>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                Review your weekly activity and resource exploration. Perfect for reflection journals and tracking your educational progress.
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 5px 0;">🏆 Student Badges</h3>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                Earn achievements as you explore resources and build your knowledge. Gamify your learning experience!
              </p>
            </div>

            <div>
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 5px 0;">🤖 Solace Learning Preferences</h3>
              <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                Customize your AI guide's tone and receive cultural humility reminders. Tailor your learning support to your needs.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/profile"
               style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              Explore Your Student Features
            </a>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 30px; border-radius: 4px;">
            <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
              <strong>⚠️ Important Ethical Reminder:</strong> Student Mode is for educational use only.
              Do NOT enter client-identifying information, personal health information, or any confidential data.
              Always maintain professional boundaries and ethical standards in your learning activities.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <h3 style="color: #1e293b; font-size: 16px; margin-top: 0;">Getting Started Tips:</h3>
            <ul style="color: #64748b; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>Visit your Profile to see all your new student features</li>
              <li>Create your first Resource Kit to organize resources by topic or project</li>
              <li>Start taking Learning Notes as you explore community resources</li>
              <li>Check Settings to customize your Solace learning preferences</li>
              <li>Explore resources and earn your first student badge!</li>
            </ul>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
              Need help? Have questions? We're here to support your learning journey.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">
              © ${new Date().getFullYear()} Solace Resources - Supporting Human Services Education
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending welcome email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-student-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
