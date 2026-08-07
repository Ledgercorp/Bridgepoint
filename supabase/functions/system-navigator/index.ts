import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requestChatCompletion } from "../_shared/openai-provider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, location, additionalContext } = await req.json();
    console.log("System Navigator request:", { task, location, additionalContext });

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      throw new Error("AI service is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("User authenticated:", user.id);

    // Check professional verification or demo mode
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_professional_verified, preferences')
      .eq('user_id', user.id)
      .single();

    const isDemoMode = profile?.preferences?.demoMode === true;
    const isProfessionalVerified = profile?.is_professional_verified === true;

    if (profileError || (!isProfessionalVerified && !isDemoMode)) {
      return new Response(JSON.stringify({ error: "Professional verification required" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Access granted:", { isProfessionalVerified, isDemoMode });

    // Build comprehensive system prompt
    const systemPrompt = `You are a Multi-Step System Navigator for human services professionals.

Your role is to provide clear, step-by-step guidance for navigating complex systems like:
- Housing assistance (emergency shelter, transitional housing, permanent housing)
- Healthcare access (Medicaid enrollment, clinic navigation, insurance)
- ID replacement (birth certificates, state IDs, Social Security cards)
- Benefits enrollment (SNAP, TANF, SSI/SSDI, unemployment)
- Legal aid systems (court navigation, free legal services)
- Transportation assistance (public transit programs, vehicle help)

For each system navigation request, provide:
1. **Overview**: Brief explanation of the system and typical timeline
2. **Step-by-Step Process**: Clear, numbered steps in order
3. **Documents Needed**: List all required documents for each step
4. **Local Entry Points**: Where to start in ${location || 'the local area'}
5. **Common Obstacles**: What might go wrong and how to prepare
6. **Alternative Paths**: Backup options if primary route doesn't work
7. **Important Notes**: Time-sensitive details, deadlines, or warnings

Format your response clearly with headers and bullet points. Be specific, practical, and focused on real-world navigation. Avoid legal advice, clinical recommendations, or guarantees. Always remind professionals to verify current policies with local agencies.

${additionalContext ? `Additional context: ${additionalContext}` : ''}`;

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: task }
      ],
      temperature: 0.7,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const navigationGuide = data.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      navigationGuide,
      task,
      location: location || 'Not specified'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in system-navigator function:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
