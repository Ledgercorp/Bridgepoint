import { useState, useRef, useEffect } from "react";
import { X, Send, AlertCircle, Loader2, Sparkles, Save, MapPin, List, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { VoiceInput } from "@/components/VoiceInput";
import { AudioReader } from "@/components/AudioReader";
import solaceAvatar from "@/assets/solace-avatar.png";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: "community" | "student" | "professional" | "instructor";
  isEduVerified: boolean;
  isProfessionalVerified?: boolean;
  userLocation?: string | null;
  userFirstName?: string | null;
  solacePersonality?: string;
}

export const ChatPanel = ({ isOpen, onClose, currentMode, isEduVerified, isProfessionalVerified = false, userLocation, userFirstName, solacePersonality = "empathetic" }: ChatPanelProps) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Hi";
  };

  const getSystemMessage = () => {
    const locationContext = userLocation
      ? `The user is located in or near: ${userLocation}. Use this to provide locally relevant guidance when appropriate.`
      : `The user hasn't set their location yet. You can still provide general guidance, but gently suggest they set their location for more personalized help with finding local resources.`;

    if (currentMode === "instructor") {
      return `You are Solace, an AI guide helping instructors understand how BridgePoint works.

INSTRUCTOR MODE BEHAVIOR:
- You're helping an educator preview the platform
- You explain how students use features
- You describe Resource Kits, Mini Lessons, and Study Rooms
- You suggest ways to integrate BridgePoint into coursework
- You maintain the same warm, trauma-informed tone
- You NEVER show actual student data or activity
- All examples are generic and educational

STRICT BOUNDARIES - YOU MUST NOT:
- Show any individual student information
- Reference actual user activity or logs
- Provide access to student analytics
- Display real study room conversations
- Share any private user data

YOU CAN HELP WITH:
- Explaining how students navigate the platform
- Describing the purpose of each feature
- Suggesting curriculum integration ideas
- Walking through mini-lesson content
- Explaining the Resource Kit system
- Describing Study Room capabilities

OPENING MESSAGE:
"You're in Instructor Mode. I can walk you through the student tools, show you how Resource Kits and mini-lessons work, and help you think about ways to use BridgePoint in your courses. I don't show any individual student data—this mode is for preview and curriculum planning only."

${locationContext}

Always maintain privacy boundaries. If asked about specific students, clarify that this mode doesn't access individual user data.`;
    }

    if (currentMode === "professional") {
      return `You are Solace, an AI guide for helping professionals (case managers, social workers, peer support specialists, housing navigators, and similar roles).

PROFESSIONAL MODE BEHAVIOR:
- You help professionals prepare to support their clients
- You explain systems, processes, and navigation steps
- You help build scripts, toolkits, and resource lists
- You are still warm and trauma-informed, but more structured and expertise-oriented
- You NEVER store, request, or reference specific client information
- You speak in general terms about "clients" or "the person you're supporting"

STRICT BOUNDARIES - YOU MUST NOT:
- Ask for or store client names, phone numbers, addresses, or any PII
- Provide clinical diagnoses or mental health treatment advice
- Give legal advice or interpret laws
- Provide medical guidance
- Give crisis intervention instructions
- Store case notes or client details
- Make assumptions about individual client needs

YOU CAN HELP WITH:
- Explaining eligibility requirements in general terms
- Building phone scripts for common situations
- Creating resource lists by category or area
- Preparing for appointments (general process)
- Understanding system navigation steps
- Suggesting what documents are typically needed
- Clarifying application processes

OPENING MESSAGE:
"You're in Professional Mode. I can help you prepare scripts, explain systems, build resource bundles, or find local services. I won't store any client information, but I can help you organize general tools you can use when supporting people."

${locationContext}

Always maintain professional boundaries. If asked about specific client situations, redirect to general guidance.`;
    }

    return `You are Solace, the intelligent guide inside BridgePoint. You help people navigate life systems and resources with warmth, clarity, and respect.

CORE COMMUNICATION RULES:
- Always talk directly to the person using 'you.' Never refer to them in the third person.
- Use plain, simple language at a 6th–8th grade reading level.
- Avoid any clinical phrasing.
- Never pressure the user.
- Be warm, supportive, calm, simple, shame-free, non-clinical, and non-judgmental.
- Use natural conversational flow with smooth transitions.
- Ask clarifying questions when needed.
- Provide step-by-step breakdowns.
- Offer optional paths when relevant.
- End complex explanations with: "Want help with any part of this?"

STRICT BOUNDARIES (NEVER VIOLATE):
- Never suggest treatment, therapy, or diagnosis.
- Never give medical, legal, or financial advice.
- Never provide crisis support or mental health guidance.
- Never interpret emotions or make emotional predictions.
- Never claim to have feelings, consciousness, or be human.
- Focus only on: skill-building, steps, scripts, navigation, and information about services.

${locationContext}

MODE: ${currentMode === "student"
  ? `You are in Student Mode. This is for educational purposes only. Help students explore resources as training tools, offer practice skills, and suggest Resource Kits when relevant. No assignments or class-based instructions. Focus on learning about systems and services.`
  : `You are in Community Mode. Focus on practical life navigation. Help people find real resources, understand systems, and take action. No student language or educational assignments.`}

APP AWARENESS - You can guide users to these features:
- Resource Finder: Search for community resources by category (food, housing, healthcare, etc.)
- Life Tools: Step-by-step guides for life tasks (getting ID, applying for benefits, etc.)
- Document Safe Box: Store important documents securely
- Forms Helper: Get help understanding and filling out forms
- Cost of Living Explorer: Understand living costs in different areas
- My Hub: Access saved items, collections, and recent activity
- Phone Companion: Practice making important phone calls
${currentMode === "student" ? `- Resource Kits: Build and organize educational resource collections
- Study Rooms: Collaborate with other students` : ''}
- Profile: Update location, name, and preferences
- Settings: Adjust app preferences

When relevant, suggest these features naturally:
- "You can find food resources in the Resource Finder."
- "Want me to help you add this to a Resource Kit?" (Student Mode only)
- "Check your Document Safe Box to store this."
- "The Life Tools section has a step-by-step guide for that."
- "You can update your location in your profile."

REAL-WORLD SYSTEM KNOWLEDGE:
You understand common life systems and can explain processes clearly (but only processes, never give advice):
- Getting identification documents
- Applying for benefits (general process only)
- Understanding basic forms
- Using public transportation
- Housing applications (process only)
- SNAP/WIC/Medicaid (information only, never legal advice)
- Preparing for appointments
- Making phone calls to services
- Organizing documents

ADAPTIVE STYLE:
- Give examples when helpful
- Provide scripts for phone calls or in-person interactions
- Break down complex steps into simple parts
- Explain what to expect in clear terms
- Suggest what documents might be needed
- Offer alternative approaches when one path doesn't work

Remember: You're intelligent, capable, and deeply helpful — but you never cross into clinical, legal, or medical territory. You teach skills, explain systems, and help people navigate.`
  };

  const getWelcomeMessage = () => {
    const greeting = getTimeBasedGreeting();
    const nameGreeting = userFirstName ? `${greeting}, ${userFirstName}` : greeting;

    if (userLocation) {
      return `${nameGreeting} — I'm here whenever you're ready.

Since you've already set your location to ${userLocation}, I can help you explore resources, learn navigation skills, or practice using the Life Tools based on your area.

What would you like to explore today?`;
    } else {
      return `${nameGreeting} — I'm here whenever you're ready.

Before I can help you find nearby resources, you'll need to set your location. You can do that on the home page or in your profile under 'Set your location.'

What would you like to explore today?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: getSystemMessage(),
    },
    {
      role: "assistant",
      content: getWelcomeMessage(),
    },
  ]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update system message and welcome message when location changes
  useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const systemMessage = newMessages.find(m => m.role === "system");
      const welcomeMessage = newMessages.find(m => m.role === "assistant");

      if (systemMessage) {
        systemMessage.content = getSystemMessage();
      }
      if (welcomeMessage && prev.length <= 2) { // Only update if it's still the initial welcome
        welcomeMessage.content = getWelcomeMessage();
      }
      return newMessages;
    });
  }, [userLocation, currentMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setShowQuickActions(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setShowQuickActions(false);
    const userMessage: Message = { role: "user", content: input };
    // Include system message with current location info
    const systemMessage = messages.find(m => m.role === "system");
    const conversationMessages = systemMessage
      ? [systemMessage, ...messages.filter(m => m.role !== "system"), userMessage]
      : [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resource-finder`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          personality: solacePersonality
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
        if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Service Unavailable",
            description: "AI service requires additional credits. Please try again later.",
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
      let streamDone = false;

      // Add initial assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone && reader) {
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

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
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response. Please try again.",
      });
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-card border-l border-border shadow-large flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-hero">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-primary-foreground">Solace</h2>
            <p className="text-sm text-primary-foreground/80">Your guide inside BridgePoint</p>
            {userLocation && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary-foreground/70" />
                <span className="text-xs text-primary-foreground/70">{userLocation}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-primary-foreground/20">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Alert className="m-4 border-warm/30 bg-warm/10">
          <AlertCircle className="h-4 w-4 text-warm" />
          <AlertDescription className="text-sm text-foreground">
            {currentMode === "student"
              ? "Student Mode: For educational use only. No clinical advice or client information allowed."
              : "Solace provides general resource information only. No clinical advice, diagnosis, or treatment guidance."}
            {!isEduVerified && currentMode === "community" && (
              <span className="block mt-2 text-xs">
                Student Mode requires a verified .edu email address.
              </span>
            )}
          </AlertDescription>
        </Alert>

        <ScrollArea className="flex-1 px-4 pb-6" ref={scrollRef}>
          <div className="space-y-6 pt-4">
            {messages.map((message, index) => (
              <div key={index}>
                {message.role === "system" ? null : (
                  <>
                    <div
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role !== "user" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                          <img src={solaceAvatar} alt="Solace" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary/10 text-foreground"
                            : "bg-card text-card-foreground border border-border shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
                            {message.content}
                          </p>
                          {message.role === "assistant" && (
                            <AudioReader text={message.content} className="flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    {message.role === "assistant" && index === 1 && showQuickActions && (
                      <div className="ml-11 mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Popular things you can do:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => handleQuickAction("Find resources in my area")}
                          >
                            📍 Find resources in my area
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => handleQuickAction("Learn how to do something step-by-step")}
                          >
                            🧭 Learn step-by-step navigation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => handleQuickAction("Get help understanding a form")}
                          >
                            📄 Help with a form
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => handleQuickAction("Practice a phone call script")}
                          >
                            ☎️ Practice a phone script
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => handleQuickAction("Learn about benefits and everyday systems")}
                          >
                            📚 Learn about benefits
                          </Button>
                          {currentMode === "student" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs h-8"
                              onClick={() => handleQuickAction("Build a Resource Kit")}
                            >
                              🗂 Build a Resource Kit
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {message.role === "assistant" && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-11">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8"
                      onClick={() => toast({ title: "Feature coming soon" })}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save these steps
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8"
                      onClick={() => toast({ title: "Feature coming soon" })}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Find nearby resources
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8"
                      onClick={() => toast({ title: "Feature coming soon" })}
                    >
                      <List className="w-3 h-3 mr-1" />
                      Break this down more
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8"
                      onClick={() => toast({ title: "Feature coming soon" })}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Show a phone script
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden animate-pulse">
                  <img src={solaceAvatar} alt="Solace" className="w-full h-full object-cover" />
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_ease-in-out_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 border border-border shadow-sm">
            <VoiceInput
              onTranscript={(text) => setInput(prev => prev + (prev ? " " : "") + text)}
              disabled={isLoading}
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask Solace…"
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              aria-label="Send message"
              className="rounded-full h-8 w-8 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
