import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { clientSituation, servicesNeeded, barriers, currentDateTime } = await req.json();

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('AI service is not configured');
    }

    const systemPrompt = `You are a professional case documentation assistant for human services professionals.
Generate comprehensive, well-organized case documentation based on the provided information.

CRITICAL DATE INSTRUCTION:
- The current date and time is: ${currentDateTime || new Date().toISOString()}
- You MUST use this exact date for the "Documentation Date" field
- Do NOT use any other date

IMPORTANT:
- Do NOT include any personally identifying information (names, addresses, SSN, etc.)
- Use professional social work/case management language
- Be specific and actionable in your recommendations
- Format the output in clean markdown

Your documentation should include:
1. **Documentation Date** - Use the current date provided: ${currentDateTime || new Date().toISOString()}
2. **Case Summary** - Brief overview of the situation
3. **Identified Needs** - List of assessed needs
4. **Barriers to Services** - Challenges that may impede progress
5. **Recommended Resources** - Specific programs or services to connect
6. **Action Plan** - Step-by-step next steps with timeframes
7. **Follow-up Recommendations** - When and how to follow up`;

    const userPrompt = `Generate case documentation for the following (Documentation Date: ${currentDateTime || new Date().toISOString()}):

**Client Situation:**
${clientSituation}

${servicesNeeded ? `**Services Needed:**\n${servicesNeeded}` : ''}

${barriers ? `**Barriers Identified:**\n${barriers}` : ''}

Please provide comprehensive, actionable documentation.`;

    const response = await requestChatCompletion({
      apiKey: openAIKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      throw new Error('Failed to generate documentation');
    }

    const data = await response.json();
    const documentation = data.choices?.[0]?.message?.content;

    if (!documentation) {
      throw new Error('No documentation generated');
    }

    return new Response(JSON.stringify({ documentation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating case documentation:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
