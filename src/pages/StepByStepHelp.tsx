import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Clock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserMode } from "@/hooks/useUserMode";
import { AudioReader } from "@/components/AudioReader";
import { ReminderDialog } from "@/components/ReminderDialog";
import { VoiceInput } from "@/components/VoiceInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function StepByStepHelp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useUserMode();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [savedStepId, setSavedStepId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-load prompt from URL if provided (for Quick Tasks)
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && messages.length === 0) {
      setInput(prompt);
      // Auto-send after a brief delay
      setTimeout(() => {
        handleSendWithPrompt(prompt);
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendWithPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: promptText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/life-navigation`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [userMessage],
          toolType: "step-by-step"
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before sending another message.",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Error parsing stream:", e);
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const handleSend = () => handleSendWithPrompt(input);

  const handleSaveSteps = async () => {
    if (!user || messages.length === 0) return;

    try {
      const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();
      if (!lastAssistantMessage) return;

      const { data, error } = await supabase.from("saved_navigation_steps").insert({
        user_id: user.id,
        title: input || "Saved Steps",
        category: "General",
        steps: { content: lastAssistantMessage.content },
      }).select().single();

      if (error) throw error;

      setSavedStepId(data.id);

      toast({
        title: "Steps Saved",
        description: "Your step-by-step guide has been saved.",
      });

      // Check if reminders are enabled
      const remindersEnabled = localStorage.getItem("remindersEnabled");
      if (remindersEnabled === "true" || profile?.preferences?.remindersEnabled) {
        setReminderDialogOpen(true);
      }
    } catch (error) {
      console.error("Error saving steps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save steps.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Ask for Step-by-Step Help</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Ask me anything about real-world tasks like getting an ID, applying for benefits,
              handling forms, or finding services. I'll break it down into simple, doable steps.
            </CardDescription>
          </CardHeader>
        </Card>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-muted-foreground text-center mb-4">
                  What do you need help with? Try asking:
                </p>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => setInput("How do I get a state ID?")}
                  >
                    "How do I get a state ID?"
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => setInput("How do I apply for Medicaid?")}
                  >
                    "How do I apply for Medicaid?"
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => setInput("I need help with food today")}
                  >
                    "I need help with food today"
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => setInput("How do I get transportation to work?")}
                  >
                    "How do I get transportation to work?"
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[500px] rounded-lg border bg-card p-4 mb-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[85%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap text-sm flex-1">{message.content}</p>
                      {message.role === "assistant" && (
                        <AudioReader text={message.content} className="flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for help with any task..."
            className="flex-1"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <VoiceInput
              onTranscript={(text) => setInput(prev => prev + (prev ? " " : "") + text)}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              Send
            </Button>
            {messages.length > 0 && user && (
              <Button variant="outline" onClick={handleSaveSteps} size="icon">
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {savedStepId && user && (
        <ReminderDialog
          open={reminderDialogOpen}
          onClose={() => setReminderDialogOpen(false)}
          taskType="saved_step"
          taskId={savedStepId}
          taskTitle={input || "Saved Steps"}
          userId={user.id}
        />
      )}
    </div>
  );
}
