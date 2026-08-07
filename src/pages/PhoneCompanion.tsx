import { useState } from "react";
import { ArrowLeft, Phone, Copy, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PhoneCompanion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [callPurpose, setCallPurpose] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateScript = async () => {
    if (!callPurpose.trim()) {
      toast({
        variant: "destructive",
        title: "Please describe your call",
        description: "Tell me what you need to call about.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/life-navigation`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: callPurpose }],
          toolType: "phone-companion"
        }),
      });

      if (!response.ok) throw new Error("Failed to generate script");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let scriptContent = "";
      let textBuffer = "";

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
              scriptContent += content;
              setGeneratedScript(scriptContent);
            }
          } catch (e) {
            console.error("Error parsing stream:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate script.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Phone className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Phone Call Companion</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prepare for Your Call</CardTitle>
            <CardDescription>
              I'll help you prepare what to say, what questions to ask, and what to expect.
              Remember: You can always ask them to repeat or slow down.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="script" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="script">Call Script</TabsTrigger>
            <TabsTrigger value="questions">Questions to Ask</TabsTrigger>
            <TabsTrigger value="tips">Grounding Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What do you need to call about?
                  </label>
                  <Textarea
                    value={callPurpose}
                    onChange={(e) => setCallPurpose(e.target.value)}
                    placeholder="Example: I need to schedule a Medicaid appointment"
                    rows={3}
                    className="mb-4"
                  />
                  <Button onClick={handleGenerateScript} disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Call Script"}
                  </Button>
                </div>

                {generatedScript && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Your Call Script</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyScript}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="whitespace-pre-wrap text-sm">{generatedScript}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Questions You Can Ask</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium">Basic Questions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>"What documents do I need to bring?"</li>
                    <li>"What are your office hours?"</li>
                    <li>"Is there a fee for this service?"</li>
                    <li>"How long will this take?"</li>
                    <li>"What happens next after this call?"</li>
                  </ul>
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium">If You Don't Understand:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>"Can you explain that in simpler terms?"</li>
                    <li>"Can you repeat that more slowly?"</li>
                    <li>"Can you send that to me in writing?"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Before You Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium">Take a Moment:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Take 3 slow, deep breaths</li>
                    <li>Have a glass of water nearby</li>
                    <li>Keep your script and any documents in front of you</li>
                    <li>It's okay to take notes during the call</li>
                    <li>You can always call back if you need to</li>
                  </ul>
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium">Remember:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You have the right to ask questions</li>
                    <li>It's okay to ask them to slow down or repeat</li>
                    <li>They are there to help you</li>
                    <li>Take your time - there's no rush</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
