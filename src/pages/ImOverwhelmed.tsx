import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImOverwhelmed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">I'm Overwhelmed</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Take a Moment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-muted rounded-lg p-6">
                <p className="text-lg mb-4">Take three slow, deep breaths</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Breathe in for 4... Hold for 4... Out for 4...</p>
                  <p>You're doing your best, and that's enough.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">It's Okay to Feel This Way</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigating these systems is hard. You're not alone in feeling overwhelmed.
                    Take your time. You can always come back to this later.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Small Steps Are Still Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have to do everything at once. Pick one small thing.
                    That's progress. That's enough for today.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">You Have Support</h3>
                  <p className="text-sm text-muted-foreground">
                    BridgePoint is here whenever you're ready. Take a break, rest,
                    and come back when you feel able.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-center">If You're in Crisis</h3>
              <div className="space-y-2 text-sm">
                <p className="text-center mb-4">Please reach out to these resources:</p>
                <div className="space-y-2">
                  <p><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</p>
                  <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                  <p><strong>Emergency:</strong> Call 911</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="w-full">
                Take Me Home
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
