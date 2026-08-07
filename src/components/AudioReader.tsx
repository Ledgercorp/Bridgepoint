import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AudioReaderProps {
  text: string;
  className?: string;
}

export function AudioReader({ text, className = "" }: AudioReaderProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if audio-read is enabled in settings
    const audioReadEnabled = localStorage.getItem("audioReadEnabled");
    setIsEnabled(audioReadEnabled !== "false");
  }, []);

  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSpeak = async () => {
    // Stop if currently speaking
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    try {
      // Clean the text for better speech
      const cleanText = text
        .replace(/\*/g, "")
        .replace(/\\n\\n/g, "\n\n")
        .replace(/\\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+/g, " ")
        .trim();

      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const { audioContent } = await response.json();

      // Convert base64 to audio
      const audioData = atob(audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Unable to play audio.",
        });
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Speech Error",
        description: "Unable to read text aloud. Please try again.",
      });
    }
  };

  if (!isEnabled) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSpeak}
      className={`gap-2 ${className}`}
      title={isSpeaking ? "Stop reading" : "Read aloud"}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading</span>
        </>
      ) : isSpeaking ? (
        <>
          <VolumeX className="h-4 w-4" />
          <span className="text-xs">Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          <span className="text-xs">Listen</span>
        </>
      )}
    </Button>
  );
}
