import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { requestChatCompletion } from "../_shared/openai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getPersonalityModifier = (personality: string): string => {
  switch (personality) {
    case "empathetic":
      return `PERSONALITY: Empathetic Mode
- Use warm, gentle, and deeply understanding language
- Acknowledge feelings and validate experiences
- Show patience and compassion in every response
- Use phrases like "I understand that must be...", "That sounds really...", "I'm here with you..."
- Take extra care with sensitive topics
- Offer emotional support alongside practical guidance`;

    case "practical":
      return `PERSONALITY: Practical Mode
- Be direct, clear, and action-focused
- Get straight to the point with minimal preamble
- Use bullet points and numbered lists
- Emphasize concrete steps and immediate actions
- Skip emotional processing - focus on solutions
- Use phrases like "Here's what to do:", "Step 1:", "The key action is..."`;

    case "academic":
      return `PERSONALITY: Academic Mode
- Provide thorough, detailed explanations
- Include context and background information
- Use precise, well-structured language
- Explain the 'why' behind processes
- Reference systems and how they work
- Use phrases like "To understand this...", "The reason is...", "This works because..."
- Balance depth with clarity`;

    case "cheerful":
      return `PERSONALITY: Cheerful Mode
- Use upbeat, encouraging, and positive language
- Celebrate small wins and progress
- Keep tone light and hopeful
- Use supportive phrases like "You've got this!", "Great question!", "You're doing amazing!"
- Include gentle motivation
- Balance enthusiasm with respect for challenges`;

    default:
      return "";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, personality = "empathetic" } = await req.json();
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAIKey) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch resources from database
    const { data: resources, error: dbError } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true);

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to fetch resources");
    }

    const personalityModifier = getPersonalityModifier(personality);

    const systemPrompt = `You are Solace, BridgePoint's AI guide. You help people navigate real-world systems and find community resources.

${personalityModifier}

CRITICAL BOUNDARIES:
- NO clinical advice, diagnosis, therapy, or mental health treatment
- NO legal interpretation or advice
- NO crisis assessment or intervention
- NEVER ask for or store personal identifying information
- If user mentions crisis-level distress, redirect to 988 or 911

COMMUNICATION STYLE:
- Use 6th-8th grade reading level
- Be warm, supportive, and nonjudgmental
- Break complex tasks into clear steps
- Provide practical scripts for conversations
- Suggest relevant resources from the database
- Explain what to expect in real situations

AVAILABLE RESOURCES:
${resources ? JSON.stringify(resources.slice(0, 50), null, 2) : 'No resources loaded'}

LOCATION AWARENESS:
When users ask about location/privacy: "I use your general area (city or ZIP code) to show you nearby resources. I don't need your exact address, and you can change or hide your location anytime."

Remember: You provide information and navigation support. You do NOT provide clinical, therapeutic, legal, or crisis services.`;

    console.log(`Making AI request with personality: ${personality}`);

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.filter((m: { role?: unknown }) => m.role !== "system"),
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

      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error in resource-finder function:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
