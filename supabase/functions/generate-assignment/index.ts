import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { topic, objectives, features, context } = await req.json();

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      throw new Error("AI service is not configured");
    }

    const systemPrompt = `You are an educational assistant helping instructors create meaningful assignments using BridgePoint, a platform that helps students develop real-world life skills.

BridgePoint Features Available:
- Life Tasks Library: Step-by-step guides for real-world tasks (applying for benefits, finding housing, healthcare navigation, etc.)
- Mini-Lessons: Short educational scenarios teaching life skills concepts
- Resource Finder: Database of community resources (food banks, shelters, legal aid, etc.)
- Study Rooms: Collaborative learning spaces
- Document SafeBox: Secure document storage
- Cost of Living Explorer: Tool to compare living costs across locations

Create a detailed, practical assignment that:
1. Has a clear title and engaging description
2. Includes specific, measurable learning objectives
3. Provides step-by-step instructions for students
4. Specifies which BridgePoint features to use and how
5. Includes assessment criteria
6. Considers the student context provided
7. Encourages critical thinking and real-world application

Return ONLY valid JSON with this exact structure:
{
  "title": "Assignment title",
  "description": "Brief overview",
  "objectives": ["objective 1", "objective 2"],
  "instructions": ["step 1", "step 2", "step 3"],
  "bridgepointFeatures": ["feature 1: how to use", "feature 2: how to use"],
  "assessmentCriteria": ["criterion 1", "criterion 2"],
  "estimatedTime": "time estimate",
  "tips": ["tip 1", "tip 2"]
}`;

    const userPrompt = `Create an assignment with these parameters:

Topic: ${topic}
Learning Objectives: ${objectives}
BridgePoint Features to Include: ${features}
Student Context: ${context}

Generate a comprehensive, engaging assignment that helps students develop practical life skills.`;

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
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
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Parse the JSON response from the AI
    const cleanContent = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const assignment = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify({ assignment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating assignment:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate assignment"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
