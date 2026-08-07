import { useState } from "react";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function FormHelper() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setFormAnalysis("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('analyze-form', {
        body: formData,
      });

      if (error) throw error;

      if (data?.analysis) {
        setFormAnalysis(JSON.stringify(data.analysis, null, 2));
        toast({
          title: "Form Analyzed",
          description: "Your form has been analyzed successfully.",
        });
      } else {
        throw new Error('No analysis returned');
      }
    } catch (error) {
      console.error('Error analyzing form:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "There was an error analyzing your form.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Form Helper</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get Help With Forms</CardTitle>
            <CardDescription>
              Upload a form (PDF or photo), and I'll help you understand what's required,
              explain questions in plain language, and suggest what documents you'll need.
            </CardDescription>
          </CardHeader>
        </Card>

        <Alert className="mb-6">
          <AlertDescription>
            <strong>Privacy Notice:</strong> Forms are analyzed only to help you understand them.
            No personal information is stored or shared.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a form (PDF, JPG, or PNG)
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="form-upload"
                />
                <label htmlFor="form-upload">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>

              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Analyzing your form...</p>
                </div>
              )}

              {formAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Form Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      {formAnalysis}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
