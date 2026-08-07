import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  Download,
  Copy,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";

export default function ProfessionalTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProfessionalVerified, currentMode, loading: userLoading, isAdmin } = useUserMode();
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [scriptTemplate, setScriptTemplate] = useState("");

  // Professional Tools is professional-only (admins can bypass)
  const hasAccess = isAdmin || (isProfessionalVerified && currentMode === "professional");

  useEffect(() => {
    if (!userLoading && !hasAccess) {
      navigate("/community-home");
    }
  }, [userLoading, hasAccess, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const appointmentPrepTemplates = [
    {
      title: "Housing Meeting",
      items: [
        "Current housing status",
        "Income documentation",
        "ID verification",
        "Rental history if available",
        "References list",
        "Local housing authority contact info"
      ]
    },
    {
      title: "Benefits Application",
      items: [
        "Social Security card",
        "Birth certificate",
        "Proof of income",
        "Bank statements",
        "Medical records",
        "Disability documentation if applicable"
      ]
    },
    {
      title: "Healthcare Enrollment",
      items: [
        "Insurance information",
        "Medical history summary",
        "Current medications list",
        "Pharmacy preference",
        "Emergency contacts",
        "Transportation plan"
      ]
    }
  ];

  const scriptTemplates = [
    {
      title: "Calling for Intake Appointment",
      script: "Hi, my name is [Your Name] and I'm helping someone access your services. They're interested in [specific service]. Could you tell me about your intake process and what documents they'll need to bring?"
    },
    {
      title: "Benefits Status Check",
      script: "Hello, I'm calling to check on the status of a benefits application. The application number is [number] and it was submitted on [date]. Can you provide an update on where this is in the review process?"
    },
    {
      title: "Housing Waitlist Inquiry",
      script: "Hi, I'm calling about the housing waitlist. Could you tell me the current wait time and confirm that [client initials only] is still on the active list? Their application was submitted on [date]."
    }
  ];

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({
      title: "Script copied",
      description: "Template copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-home")}>
            ← Back to Professional Home
          </Button>
          <h1 className="text-3xl font-bold text-foreground mt-4">Professional Tools</h1>
          <p className="text-muted-foreground mt-2">
            Tools to support your work with individuals and families
          </p>
        </div>

        <Tabs defaultValue="appointment" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointment">Appointment Prep</TabsTrigger>
            <TabsTrigger value="scripts">Call Scripts</TabsTrigger>
            <TabsTrigger value="checklists">Document Checklists</TabsTrigger>
            <TabsTrigger value="notes">Meeting Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="appointment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Preparation Templates</CardTitle>
                <CardDescription>
                  Common document lists for different appointment types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {appointmentPrepTemplates.map((template) => (
                  <div key={template.title} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {template.title}
                    </h3>
                    <ul className="space-y-2">
                      {template.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckSquare className="w-4 h-4 mt-0.5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Script Templates</CardTitle>
                <CardDescription>
                  Professional phone scripts for common scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scriptTemplates.map((template) => (
                  <div key={template.title} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {template.title}
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyScript(template.script)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {template.script}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Checklists</CardTitle>
                <CardDescription>
                  Required documents for common processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">ID Documents</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Birth certificate</li>
                      <li>• Social Security card</li>
                      <li>• State-issued ID or Driver's license</li>
                      <li>• Proof of address</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Income Verification</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Recent pay stubs (last 3 months)</li>
                      <li>• Tax returns</li>
                      <li>• Benefits award letters</li>
                      <li>• Bank statements</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Medical Records</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Insurance cards</li>
                      <li>• Medication list</li>
                      <li>• Doctor contact information</li>
                      <li>• Medical history summary</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Housing Application</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Proof of income</li>
                      <li>• References</li>
                      <li>• Rental history</li>
                      <li>• Criminal background check</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Notes Template</CardTitle>
                <CardDescription>
                  Non-identifying notes for professional use only
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Input placeholder="e.g., Housing intake, Benefits follow-up" />
                </div>
                <div className="space-y-2">
                  <Label>General Notes (No Personal Information)</Label>
                  <Textarea
                    placeholder="General observations, next steps, resources discussed..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Steps</Label>
                  <Textarea
                    placeholder="Follow-up actions, resources to gather..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}