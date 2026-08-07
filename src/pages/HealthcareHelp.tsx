import { useState } from "react";
import { ArrowLeft, Heart, FileText, Phone, MapPin, Pill, Users, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HealthcareHelp() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const healthcareTerms = [
    {
      term: "Primary Care",
      definition: "Your main doctor who you see for check-ups and everyday health needs.",
      example: "You might visit primary care for a cold, yearly check-up, or to get a prescription refilled."
    },
    {
      term: "Urgent Care",
      definition: "A clinic you can visit without an appointment for problems that need quick attention but aren't life-threatening.",
      example: "You might go to urgent care for a fever, sprained ankle, or cut that needs stitches."
    },
    {
      term: "Community Health Center",
      definition: "A health clinic that serves everyone, regardless of insurance or ability to pay.",
      example: "These centers often offer sliding-scale fees based on your income."
    },
    {
      term: "Sliding Scale",
      definition: "A payment option where the cost is based on how much money you make.",
      example: "If you earn less, you pay less. If you earn more, you pay more."
    },
    {
      term: "Eligibility",
      definition: "The requirements you need to meet to qualify for a program or service.",
      example: "Medicaid eligibility often depends on your income, age, or family size."
    },
    {
      term: "Referral",
      definition: "When your doctor sends you to see another doctor or specialist.",
      example: "Your primary care doctor might give you a referral to see a heart specialist."
    },
    {
      term: "Provider",
      definition: "Any person or place that gives you healthcare, like a doctor, nurse, or clinic.",
      example: "Your healthcare provider could be a doctor, nurse practitioner, or community health center."
    },
    {
      term: "Copay",
      definition: "A fixed amount you pay for a healthcare visit or prescription.",
      example: "If your copay is $20, you pay $20 each time you visit the doctor."
    },
    {
      term: "Deductible",
      definition: "The amount you pay out of your own pocket before insurance starts to help cover costs.",
      example: "If your deductible is $500, you pay the first $500 of medical bills yourself."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Healthcare Help</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Alert Box */}
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This tool explains healthcare options and processes in plain language.
            It does not provide medical advice, diagnoses, or treatment recommendations.
            For medical emergencies, call 911. For crisis support, call 988.
          </AlertDescription>
        </Alert>

        {/* Navigation Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>What Is Healthcare?</CardTitle>
                <CardDescription>Plain-language basics about healthcare and insurance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">What health insurance is</h3>
                  <p className="text-muted-foreground">
                    Health insurance is like a membership that helps pay for doctor visits, medicine, and hospital care.
                    You or your employer pay a monthly fee (called a "premium"), and in return, the insurance company
                    helps cover some of your medical costs.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What it pays for</h3>
                  <p className="text-muted-foreground">
                    Most insurance covers check-ups, emergency care, prescriptions, lab tests, and hospital stays.
                    The amount it covers depends on your plan.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What it doesn't always cover</h3>
                  <p className="text-muted-foreground">
                    Some plans don't cover dental care, vision care, or certain treatments.
                    Always ask what's included before you sign up.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What if you don't have insurance?</h3>
                  <p className="text-muted-foreground">
                    You can still get care! Community health centers, free clinics, and sliding-scale clinics
                    provide services to people without insurance. You don't need insurance to see a doctor.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/step-by-step-help?prompt=How do I apply for Medicaid?")}>
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Apply for Medicaid</CardTitle>
                  <CardDescription>Step-by-step guide to applying for health coverage</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/step-by-step-help?prompt=Find low-cost healthcare clinics near me")}>
                <CardHeader>
                  <MapPin className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Find Low-Cost Clinics</CardTitle>
                  <CardDescription>Locate community health centers and free clinics</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/phone-companion")}>
                <CardHeader>
                  <Phone className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Call a Clinic</CardTitle>
                  <CardDescription>Get a script for scheduling an appointment</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/step-by-step-help?prompt=How do I prepare for a doctor visit?")}>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Prepare for Visit</CardTitle>
                  <CardDescription>What to bring and what to expect</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Healthcare Programs Explained</CardTitle>
                <CardDescription>Plain-language explanations of common programs</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="medicaid">
                    <AccordionTrigger>What is Medicaid?</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        Medicaid is a government program that provides free or low-cost health insurance
                        to people who earn below a certain income level.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-1">Who it generally helps:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Adults with low income</li>
                          <li>Children and teenagers</li>
                          <li>Pregnant people</li>
                          <li>People with disabilities</li>
                          <li>Seniors who need help with care</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Documents usually needed:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Proof of identity (ID, birth certificate)</li>
                          <li>Proof of income (pay stubs, tax forms)</li>
                          <li>Proof of where you live (utility bill, lease)</li>
                          <li>Social Security numbers for everyone applying</li>
                        </ul>
                      </div>
                      <Button onClick={() => navigate("/step-by-step-help?prompt=How do I apply for Medicaid?")}>
                        Get Step-by-Step Help
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="chip">
                    <AccordionTrigger>What is CHIP?</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        CHIP (Children's Health Insurance Program) provides low-cost health coverage to children
                        in families that earn too much for Medicaid but can't afford private insurance.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-1">Who it helps:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Children under 19</li>
                          <li>Families who earn too much for Medicaid</li>
                          <li>Families who can't afford private insurance</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Every state has different income limits. CHIP covers doctor visits, prescriptions,
                        dental and vision care, and hospital stays.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="community-health">
                    <AccordionTrigger>Community Health Centers (FQHCs)</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        Community health centers (also called Federally Qualified Health Centers or FQHCs)
                        are clinics that serve everyone, no matter your insurance status or ability to pay.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-1">What they offer:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Primary care for adults and children</li>
                          <li>Dental care</li>
                          <li>Mental health services</li>
                          <li>Prescription help</li>
                          <li>Sliding-scale fees based on income</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You don't need insurance or an ID to be seen. They accept everyone.
                      </p>
                      <Button onClick={() => navigate("/step-by-step-help?prompt=Find community health centers near me")}>
                        Find Nearby Centers
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="sliding-scale">
                    <AccordionTrigger>Sliding-Scale Clinics</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        Sliding-scale clinics charge based on what you can afford to pay.
                        If you earn less, you pay less. Some visits might even be free.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-1">What to bring:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Proof of income (like a pay stub)</li>
                          <li>ID if you have one</li>
                          <li>List of any medications you take</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Call ahead to ask about their sliding-scale policy and what proof of income they need.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="prescription-help">
                    <AccordionTrigger>Prescription Help Programs</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        Many programs help people get prescriptions at lower costs. These include discount cards,
                        patient assistance programs, and pharmacy savings programs.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-1">Ways to save on prescriptions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Ask your pharmacist about generic versions</li>
                          <li>Use prescription discount cards (often free)</li>
                          <li>Ask your doctor for samples</li>
                          <li>Check if the medication company has a patient assistance program</li>
                          <li>Compare prices at different pharmacies</li>
                        </ul>
                      </div>
                      <Button onClick={() => navigate("/step-by-step-help?prompt=How do I get help paying for prescriptions?")}>
                        Get Prescription Help
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Special Info Card */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Healthcare Without Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Community health centers and many free clinics provide care to everyone,
                  regardless of immigration status or documentation.
                </p>
                <div>
                  <h4 className="font-semibold mb-2">Where to go:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Federally Qualified Health Centers (FQHCs)</li>
                    <li>Free clinics</li>
                    <li>Public health departments</li>
                    <li>Some hospital emergency rooms (for emergencies)</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  These services are confidential and do not share your information with immigration authorities.
                  You have the right to healthcare.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Healthcare Tasks</CardTitle>
                <CardDescription>Get step-by-step help with common healthcare tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/step-by-step-help?prompt=How do I apply for Medicaid?")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Apply for Medicaid
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/step-by-step-help?prompt=Find low-cost healthcare clinics near me")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Find Low-Cost Clinics Near Me
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/step-by-step-help?prompt=How do I get care without insurance?")}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Get Care Without Insurance
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/step-by-step-help?prompt=How do I prepare for a doctor visit?")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Prepare for a Doctor Visit
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/step-by-step-help?prompt=How do I get help paying for prescriptions?")}
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Get Help With Prescriptions
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/phone-companion?purpose=schedule a doctor appointment")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call to Schedule an Appointment
                </Button>
              </CardContent>
            </Card>

            {/* Prepare for Visit Card */}
            <Card>
              <CardHeader>
                <CardTitle>Prepare for Your Doctor Visit</CardTitle>
                <CardDescription>A simple checklist to help you get ready</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="what-to-bring">
                    <AccordionTrigger>What to Bring</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>Any ID you have (driver's license, state ID, passport)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>Insurance card (if you have insurance)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>List of medications you currently take</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>List of questions you want to ask</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span>Proof of income (if visiting a sliding-scale clinic)</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="what-happens">
                    <AccordionTrigger>What Happens at Check-In</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        When you arrive, you'll check in at the front desk. They'll ask for your name and
                        may ask you to fill out some paperwork.
                      </p>
                      <p>
                        If you're new to the clinic, they'll give you forms asking about your health history.
                        It's okay to ask for help filling them out.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Arrive 10-15 minutes early if it's your first visit so you have time to complete paperwork.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="asking-costs">
                    <AccordionTrigger>How to Ask About Costs</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>It's completely okay to ask about costs. You can say:</p>
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="font-medium">"How much will this visit cost?"</p>
                        <p className="font-medium">"Do you offer payment plans?"</p>
                        <p className="font-medium">"Can I see an estimate before I agree to treatment?"</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Most clinics can give you a cost estimate. If the cost is too high,
                        ask if there are cheaper options or payment plans.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="if-confused">
                    <AccordionTrigger>What If I Don't Understand?</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p>
                        If the doctor or staff say something you don't understand, it's okay to ask them to explain.
                      </p>
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="font-medium">"Can you explain that in simpler words?"</p>
                        <p className="font-medium">"I don't understand. Can you say that another way?"</p>
                        <p className="font-medium">"Can you write that down for me?"</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You can also bring someone with you to help you understand and remember what's said.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Healthcare Terms Explained Simply</CardTitle>
                <CardDescription>Plain-language definitions of common healthcare words</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthcareTerms.map((item, index) => (
                    <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{item.term}</h3>
                      <p className="text-muted-foreground mb-2">{item.definition}</p>
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Example:</span> {item.example}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              Ask Solace anything about healthcare options, how programs work, or what to expect.
            </p>
            <Button onClick={() => navigate("/")}>Talk to Solace</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
