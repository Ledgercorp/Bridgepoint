import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    // Log key format for debugging (first/last chars only)
    console.log("API Key format check:", {
      length: ELEVENLABS_API_KEY.length,
      prefix: ELEVENLABS_API_KEY.substring(0, 3),
      suffix: ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 3)
    });

    // Using Sarah voice - warm, clear, friendly
    const voiceId = "EXAVITQu4vr4xnSDxMaL";

    // Generate speech with ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.65, // Balanced stability for natural variation
            similarity_boost: 0.75, // Higher for consistent warm tone
            style: 0.0, // Neutral style, not exaggerated
            use_speaker_boost: true, // Enhance voice clarity
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);

      try {
        const parsed = JSON.parse(errorText);
        const detail = parsed.detail;
        const message = detail?.message || `ElevenLabs API error: ${response.status}`;

        // Surface specific abuse/plan errors clearly to the client
        return new Response(
          JSON.stringify({ error: message }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch {
        return new Response(
          JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();

    // Convert to base64 in chunks to avoid stack overflow
    const bytes = new Uint8Array(audioData);
    const chunkSize = 8192;
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }

    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
