import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { requestChatCompletion } from "../_shared/openai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MODERATE-MESSAGE] ${step}${detailsStr}`);
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

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("AI service is not configured");

    const { message, threadId } = await req.json();

    if (!message || !threadId) {
      throw new Error("Message and threadId are required");
    }

    logStep("Moderating message", { threadId, messageLength: message.length });

    const moderationResponse = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
          {
            role: "system",
            content: `You are Solace, a safety moderator for BridgePoint's Community Navigation Bridge. Your role is to protect community members and ensure safe, non-identifying communication.

CRITICAL RULES - Block any message containing:
1. Full names (first AND last together)
2. Phone numbers in any format
3. Email addresses
4. Physical addresses (street addresses)
5. Social Security Numbers or government IDs
6. Birth dates (full dates)
7. Medical diagnoses or conditions
8. Crisis content (suicide, self-harm, violence threats)
9. Requests for money, loans, or financial assistance
10. Legal advice requests or case details
11. Clinical or medical advice requests
12. Immigration status details
13. Criminal history or legal proceedings

ALLOWED content:
- General needs described without identifying details
- Questions about resources or programs
- General navigation assistance
- First names only (without last names)
- City/zip code only (not street addresses)
- General time frames ("next week", "this month")
- General categories ("housing", "food", "documents")

Respond with a JSON object:
{
  "safe": true/false,
  "blocked_categories": ["category1", "category2"],
  "reason": "brief explanation",
  "suggested_alternative": "safer way to ask if blocked"
}`
          },
          {
            role: "user",
            content: `Moderate this message:\n\n${message}`
          }
      ],
      tools: [
          {
            type: "function",
            function: {
              name: "moderate_message",
              description: "Determine if a message is safe for the Community Navigation Bridge",
              parameters: {
                type: "object",
                properties: {
                  safe: { type: "boolean" },
                  blocked_categories: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reason: { type: "string" },
                  suggested_alternative: { type: "string" }
                },
                required: ["safe", "blocked_categories", "reason"],
                additionalProperties: false
              }
            }
          }
      ],
      toolChoice: { type: "function", function: { name: "moderate_message" } }
    });

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();
      logStep("AI moderation error", { status: moderationResponse.status, error: errorText });
      throw new Error(`AI moderation failed: ${moderationResponse.status}`);
    }

    const moderationData = await moderationResponse.json();
    logStep("AI response received", { hasToolCalls: !!moderationData.choices[0]?.message?.tool_calls });

    const toolCall = moderationData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No moderation result from AI");
    }

    const moderationResult = JSON.parse(toolCall.function.arguments);
    logStep("Moderation result", moderationResult);

    return new Response(JSON.stringify({
      safe: moderationResult.safe,
      blocked_categories: moderationResult.blocked_categories || [],
      reason: moderationResult.reason,
      suggested_alternative: moderationResult.suggested_alternative || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in moderate-thread-message", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
