import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";

interface InstructorCodeInputProps {
  onSuccess: () => void;
}

export function InstructorCodeInput({ onSuccess }: InstructorCodeInputProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        title: "Missing code",
        description: "Please enter an instructor access code",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('validate_instructor_code', {
        p_code: code.trim(),
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { valid: boolean; message: string };

      if (result.valid) {
        toast({
          title: "Success!",
          description: result.message
        });
        onSuccess();
      } else {
        toast({
          title: "Invalid Code",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error validating instructor code:', error);
      toast({
        title: "Error",
        description: "Failed to validate code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-600" />
          <CardTitle>Instructor Access Code</CardTitle>
        </div>
        <CardDescription>
          Enter your instructor access code to preview student features and plan curriculum integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="instructor-code">Access Code</Label>
          <Input
            id="instructor-code"
            type="text"
            placeholder="Enter instructor code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Contact your program administrator for an instructor access code
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            "Activate Instructor Mode"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
