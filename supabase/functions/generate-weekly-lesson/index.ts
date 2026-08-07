import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Topics Solace can teach about
const lessonTopics = [
  "navigating housing assistance programs",
  "understanding food stamp (SNAP) eligibility",
  "preparing for benefits interviews",
  "managing stress during difficult transitions",
  "building a support network in your community",
  "understanding Medicaid and healthcare options",
  "creating a personal budget on limited income",
  "communicating with case workers effectively",
  "understanding utility assistance programs",
  "job searching with employment gaps",
  "accessing mental health resources",
  "understanding childcare assistance",
  "navigating transportation assistance",
  "building credit from scratch",
  "understanding disability benefits",
  "dealing with housing insecurity",
  "finding emergency assistance",
  "understanding legal aid resources",
  "preparing important documents",
  "self-care during challenging times",
  "setting achievable goals",
  "understanding your rights as a tenant",
  "accessing educational opportunities",
  "building resilience through setbacks",
  "connecting with community resources",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weekNumber } = await req.json();

    // Use week number to deterministically select a topic
    const topicIndex = weekNumber % lessonTopics.length;
    const topic = lessonTopics[topicIndex];

    // Secondary topic for variety
    const secondaryTopicIndex = (weekNumber + 7) % lessonTopics.length;
    const secondaryTopic = lessonTopics[secondaryTopicIndex];

    const prompt = `You are Solace, a warm and supportive AI guide who helps people navigate life's challenges. Generate a fresh, engaging mini-lesson for this week.

Topic focus: "${topic}" with elements of "${secondaryTopic}"

Create a lesson in JSON format with these fields:
- title: A warm, inviting title (max 60 chars)
- content: The main lesson content (300-400 words). Be conversational, empathetic, and practical. Use "you" language. Include 2-3 actionable tips.
- scenario: A realistic practice scenario the student can think through (2-3 sentences)
- reflection_question: A thoughtful question for self-reflection
- practice_prompt: A simple action they can take this week

Make it feel like a caring mentor sharing wisdom, not a textbook. Use encouraging language and acknowledge that seeking help takes courage.

Respond ONLY with valid JSON, no markdown.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error("Failed to generate lesson from AI");
    }

    const data = await response.json();
    const lessonText = data.choices[0].message.content;
    const lesson = JSON.parse(lessonText.replace(/```json\n?|\n?```/g, ''));

    return new Response(JSON.stringify({ lesson, weekNumber, topic }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Return a fallback lesson
    const fallbackLesson = {
      title: "Building Your Support Network",
      content: "This week, let's talk about something incredibly important: you don't have to do this alone. Building a support network isn't about having dozens of friends—it's about finding even one or two people who can be there when you need them.\n\nStart small. Think about who in your life has shown up for you, even in small ways. Maybe it's a neighbor who says hello, a coworker who listens, or a family member you can call. These connections matter.\n\nHere are three ways to strengthen your support network this week:\n\n1. Reach out to someone you haven't talked to in a while. A simple \"thinking of you\" message can reopen doors.\n\n2. Look into local community groups or organizations. Libraries, community centers, and faith organizations often host free events where you can meet people facing similar challenges.\n\n3. Consider professional support. Case workers, counselors, and social workers are trained to help—using their services is a sign of strength, not weakness.\n\nRemember, asking for help is one of the bravest things you can do. Every strong person you admire has had help along the way.",
      scenario: "Imagine you're feeling overwhelmed by bills and don't know where to turn. You remember a coworker mentioned they went through something similar last year. How might you start that conversation?",
      reflection_question: "Who is one person in your life you could reach out to this week, even just to say hello?",
      practice_prompt: "Send a brief message to someone you trust, just to check in. It doesn't have to be about your challenges—connection itself is the goal."
    };

    return new Response(JSON.stringify({ lesson: fallbackLesson, weekNumber: 0, topic: "support networks" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
