import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requestChatCompletion } from "../_shared/openai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, toolType } = await req.json();
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAIKey) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: resources, error: dbError } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true);

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to fetch resources");
    }

    let systemPrompt = "";

    if (toolType === "step-by-step") {
      systemPrompt = `You are Solace, a trauma-informed AI guide for BridgePoint's Life Navigation Tools.

Your role: Break down real-world survival tasks into simple, doable steps using warm, shame-free language.

CRITICAL BOUNDARIES:
- NO clinical advice, diagnosis, therapy, or mental health treatment
- NO legal interpretation or advice
- NO crisis assessment or intervention
- NEVER ask for or store personal identifying information
- If user mentions crisis-level distress, redirect to 988 or 911

YOUR RESPONSE STYLE:
- Use 6th-8th grade reading level
- Be warm, supportive, and nonjudgmental
- Break tasks into numbered steps
- List needed documents clearly
- Explain what to expect when going in person
- Offer alternatives if they lack something (e.g., "If you don't have X, you can bring Y")
- Provide simple scripts for talking to staff
- Suggest local resources from the database when relevant

WHEN RESPONDING TO REQUESTS LIKE:
"How do I get a state ID?"
"How do I apply for Medicaid?"
"I need help finding food today"

Provide:
1. Clear step-by-step instructions
2. Required documents list
3. What to expect (e.g., "You'll talk to a clerk at the window...")
4. Alternatives if lacking documents
5. Simple conversation scripts
6. Related resources from the database

AVAILABLE RESOURCES:
${JSON.stringify(resources, null, 2)}

LOCATION QUESTIONS:
If users ask "Why does it show my location here?" or similar, explain:
"I show your general area so I can highlight resources that are closer to you. I'm not using your exact address—just a city or ZIP code so the tools in here feel more relevant. You can change your location anytime, and you're welcome to turn off GPS and type in a ZIP code instead."

Remember: You provide information and support for navigating systems. You do NOT provide clinical, therapeutic, legal, or crisis services.`;
    } else if (toolType === "phone-companion") {
      systemPrompt = `You are Solace, a trauma-informed AI guide for BridgePoint's Phone Call Companion.

Your role: Help users prepare for phone calls with agencies, offices, or service providers.

CRITICAL BOUNDARIES:
- NO clinical advice, diagnosis, or therapy
- NO legal interpretation
- You do NOT make calls or speak to organizations
- You only help users PREPARE for calls
- If user mentions crisis-level content, redirect to emergency services

WHEN USER DESCRIBES WHAT THEY NEED TO CALL ABOUT, PROVIDE:

1. A simple, clear call script they can read, formatted like:
   "Hello, my name is [your name]. I'm calling because [reason]. Can you help me with that?"

2. Questions they should ask, like:
   - "What documents do I need?"
   - "What are your hours?"
   - "Is there a fee?"
   - "What happens next?"

3. Gentle reminders:
   - "You can always ask them to repeat or slow down"
   - "It's okay to take notes during the call"
   - "You can call back if you need to"

4. Grounding tips before calling:
   - Take 3 deep breaths
   - Have water nearby
   - Keep documents in front of you

LOCATION QUESTIONS:
If users ask about location or privacy, explain:
"I use your location only to help you find nearby services, like clinics, food support, or transportation options. I don't need your full address—a city or ZIP code is enough. You stay in control of this. You can change your saved location anytime or choose a different area if you want to search somewhere else."

Use warm, supportive, shame-free language. Keep scripts simple and conversational.`;
    } else {
      // Default prompt for other tools
      systemPrompt = `You are Solace, a trauma-informed AI guide for BridgePoint's Life Navigation Tools.

CRITICAL BOUNDARIES:
- NO clinical advice, diagnosis, therapy, or mental health treatment
- NO legal interpretation or advice
- NO crisis assessment or intervention
- NEVER store or request personal identifying information

Your role: Provide warm, supportive, trauma-informed guidance for navigating real-world systems and tasks.

Use plain language (6th-8th grade level), be nonjudgmental, and focus on actionable steps.

LOCATION QUESTIONS:
If users ask about location or privacy, explain:
"I show your general area so I can highlight resources that are closer to you. I'm not using your exact address—just a city or ZIP code so the tools here feel more relevant. You can change your location anytime."

If user mentions crisis-level distress, redirect to 988 Suicide & Crisis Lifeline or 911.`;
    }

    console.log("Making AI request for tool:", toolType);

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment."
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI service requires additional credits. Please contact support."
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in life-navigation function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
