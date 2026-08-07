import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { scenario, location } = await req.json();

    if (!scenario) {
      return new Response(
        JSON.stringify({ error: "Scenario is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      throw new Error("AI service is not configured");
    }

    const systemPrompt = `You are an expert social services workflow generator. Generate detailed, actionable workflows for staff helping community members navigate public systems.

CRITICAL RULES:
- Never request or store personal identifying information
- Focus on general processes and documentation requirements
- Provide trauma-informed, accessible language
- Include alternatives for common obstacles
- Give concrete, specific steps
- Include scripts for phone calls and office visits
- List typical wait times and what to expect
- Suggest preparation strategies

Output must be valid JSON with this structure:
{
  "title": "Clear title of the task",
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "description": "Detailed instructions",
      "timeframe": "How long this takes",
      "tips": ["Helpful tip 1", "Helpful tip 2"]
    }
  ],
  "documents_needed": ["Document 1", "Document 2"],
  "alternatives": ["If X is missing, try Y", "Alternative pathway"],
  "scripts": {
    "phone": "Example script for calling offices",
    "in_person": "What to say at front desk"
  },
  "obstacles": [
    {
      "obstacle": "Common problem",
      "solution": "How to handle it"
    }
  ],
  "typical_timeframe": "Overall time estimate",
  "followup": "What happens after completion"
}`;

    const userPrompt = `Generate a detailed workflow for this scenario: "${scenario}"${location ? ` in ${location}` : ''}.

Remember:
- Be specific and actionable
- Include what documents to bring
- Provide phone scripts
- List common obstacles
- Suggest alternatives
- Give realistic timeframes
- Use accessible language`;

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
      ],
      tools: [
          {
            type: "function",
            function: {
              name: "generate_workflow",
              description: "Generate a detailed workflow for navigating public systems",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        number: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        timeframe: { type: "string" },
                        tips: { type: "array", items: { type: "string" } }
                      },
                      required: ["number", "title", "description", "timeframe"]
                    }
                  },
                  documents_needed: { type: "array", items: { type: "string" } },
                  alternatives: { type: "array", items: { type: "string" } },
                  scripts: {
                    type: "object",
                    properties: {
                      phone: { type: "string" },
                      in_person: { type: "string" }
                    }
                  },
                  obstacles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        obstacle: { type: "string" },
                        solution: { type: "string" }
                      },
                      required: ["obstacle", "solution"]
                    }
                  },
                  typical_timeframe: { type: "string" },
                  followup: { type: "string" }
                },
                required: ["title", "steps", "documents_needed", "typical_timeframe"],
                additionalProperties: false
              }
            }
          }
      ],
      toolChoice: { type: "function", function: { name: "generate_workflow" } }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI service error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No workflow generated");
    }

    const workflow = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ workflow }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error generating workflow:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate workflow"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
