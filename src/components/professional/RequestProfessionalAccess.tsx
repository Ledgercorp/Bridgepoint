import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase } from "lucide-react";

interface RequestProfessionalAccessProps {
  onSuccess: () => void;
}

export function RequestProfessionalAccess({ onSuccess }: RequestProfessionalAccessProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !role) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to verify

      const { data: verification, error } = await supabase
        .from('professional_email_verifications')
        .insert({
          professional_email: email.trim(),
          professional_role: role,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send verification email
      const { error: emailError } = await supabase.functions.invoke('send-professional-verification', {
        body: { verificationId: verification.id }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          title: "Request submitted",
          description: "Your request has been submitted. An admin will review it shortly.",
          variant: "default"
        });
      } else {
        toast({
          title: "Request submitted",
          description: "Check your email to verify your professional access"
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error requesting access:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
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
          <Briefcase className="h-5 w-5 text-primary" />
          <CardTitle>Request Professional Mode Access</CardTitle>
        </div>
        <CardDescription>
          For case managers, social workers, peer support specialists, housing navigators, and other helping professionals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="prof-email">Work Email</Label>
          <Input
            id="prof-email"
            type="email"
            placeholder="your.name@organization.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="prof-role">Your Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="prof-role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="case_manager">Case Manager</SelectItem>
              <SelectItem value="social_worker">Social Worker</SelectItem>
              <SelectItem value="peer_support">Peer Support Specialist</SelectItem>
              <SelectItem value="housing_navigator">Housing Navigator</SelectItem>
              <SelectItem value="benefits_counselor">Benefits Counselor</SelectItem>
              <SelectItem value="community_health">Community Health Worker</SelectItem>
              <SelectItem value="other">Other Helping Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !role}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Request Access"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
