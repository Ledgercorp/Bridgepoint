import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Loader2,
  Navigation,
  Home,
  Heart,
  CreditCard,
  Scale,
  Briefcase,
  Car,
  FileText,
  Sparkles,
  Save,
  History,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  FileCheck,
  Users,
  Building2,
  Plus,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import type { Json } from "@/integrations/supabase/types";

interface NavigationStep {
  id: string;
  title: string;
  description: string;
  timeEstimate?: string;
  documents?: string[];
  tips?: string[];
  resources?: { name: string; phone?: string; website?: string }[];
  completed?: boolean;
}

interface SavedPathway {
  id: string;
  title: string;
  category: string;
  steps: NavigationStep[];
  resources?: Json | null;
  created_at: string;
  updated_at: string;
}

interface ClientBarrier {
  id: string;
  label: string;
  selected: boolean;
}

const systemCategories = [
  { id: "housing", label: "Housing", icon: Home, color: "text-orange-500" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "text-red-500" },
  { id: "identification", label: "ID/Documents", icon: CreditCard, color: "text-blue-500" },
  { id: "benefits", label: "Benefits", icon: Briefcase, color: "text-green-500" },
  { id: "legal", label: "Legal Aid", icon: Scale, color: "text-purple-500" },
  { id: "transportation", label: "Transportation", icon: Car, color: "text-cyan-500" },
];

const commonBarriers: ClientBarrier[] = [
  { id: "no_id", label: "No valid ID", selected: false },
  { id: "no_address", label: "No stable address", selected: false },
  { id: "criminal_record", label: "Criminal record", selected: false },
  { id: "no_income", label: "No income verification", selected: false },
  { id: "language_barrier", label: "Language barrier", selected: false },
  { id: "disability", label: "Disability/accessibility needs", selected: false },
  { id: "mental_health", label: "Mental health challenges", selected: false },
  { id: "substance_use", label: "Substance use history", selected: false },
  { id: "eviction_history", label: "Prior eviction", selected: false },
  { id: "immigration_status", label: "Immigration status", selected: false },
  { id: "no_phone", label: "No phone/internet access", selected: false },
  { id: "childcare", label: "Childcare needs", selected: false },
];

const quickStartTemplates = [
  {
    category: "housing",
    title: "Emergency Shelter to Permanent Housing",
    description: "Complete pathway from emergency shelter through transitional to permanent housing",
    icon: Home
  },
  {
    category: "identification",
    title: "Full ID Recovery Process",
    description: "Birth certificate, Social Security card, and state ID replacement",
    icon: CreditCard
  },
  {
    category: "benefits",
    title: "Benefits Enrollment Package",
    description: "SNAP, TANF, Medicaid, and utility assistance applications",
    icon: Briefcase
  },
  {
    category: "healthcare",
    title: "Healthcare Access Without Insurance",
    description: "Medicaid enrollment, FQHC navigation, and prescription assistance",
    icon: Heart
  },
];

export default function SystemNavigator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();
  const { subscribed, loading: subscriptionLoading } = useSubscription();

  const [activeTab, setActiveTab] = useState("build");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customTask, setCustomTask] = useState("");
  const [location, setLocation] = useState(profile?.home_location || "");
  const [barriers, setBarriers] = useState<ClientBarrier[]>(commonBarriers);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPathway, setCurrentPathway] = useState<NavigationStep[] | null>(null);
  const [pathwayTitle, setPathwayTitle] = useState("");
  const [savedPathways, setSavedPathways] = useState<SavedPathway[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [rawGuide, setRawGuide] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  const hasAccess = isProfessionalVerified || isSuperAdmin || profile?.preferences?.demoMode === true;

  // Load saved pathways
  useEffect(() => {
    loadSavedPathways();
  }, []);

  const loadSavedPathways = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_navigation_steps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSavedPathways((data || []).map(item => ({
        ...item,
        steps: Array.isArray(item.steps) ? item.steps as NavigationStep[] : []
      })));
    } catch (error) {
      console.error("Error loading pathways:", error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const toggleBarrier = (id: string) => {
    setBarriers(prev =>
      prev.map(b => b.id === id ? { ...b, selected: !b.selected } : b)
    );
  };

  const getSelectedBarriers = () => {
    return barriers.filter(b => b.selected).map(b => b.label);
  };

  const generatePathway = async (template?: typeof quickStartTemplates[0]) => {
    const taskDescription = template
      ? `${template.title}: ${template.description}`
      : customTask;

    if (!taskDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Task Required",
        description: "Please select a template or describe your navigation task",
      });
      return;
    }

    if (!hasAccess) {
      toast({
        title: "Access Required",
        description: "This feature requires Professional Mode or Demo Mode.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLoadingTemplate(template?.title || null);
    setCurrentPathway(null);
    setRawGuide(null);
    setPathwayTitle(template?.title || "Custom Navigation Pathway");

    const selectedBarriersList = getSelectedBarriers();
    const barrierContext = selectedBarriersList.length > 0
      ? `\n\nIMPORTANT CLIENT BARRIERS TO ADDRESS:\n${selectedBarriersList.map(b => `- ${b}`).join('\n')}`
      : '';

    try {
      const { data, error } = await supabase.functions.invoke('system-navigator', {
        body: {
          task: taskDescription + barrierContext,
          location: location || undefined,
          additionalContext: `Generate a structured step-by-step pathway. For each step, clearly identify: the action to take, estimated time, required documents, helpful tips, and any relevant local resources or phone numbers.`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Store raw guide
      setRawGuide(data.navigationGuide);

      // Parse the response into structured steps
      const steps = parseNavigationGuide(data.navigationGuide);
      setCurrentPathway(steps);

      if (template) {
        setSelectedCategory(template.category);
      }

      // Switch to active tab to show results
      setActiveTab("active");

      toast({
        title: "Pathway Generated",
        description: `${steps.length} steps identified for this navigation pathway`,
      });
    } catch (error) {
      console.error("System navigator error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate pathway",
      });
    } finally {
      setIsLoading(false);
      setLoadingTemplate(null);
    }
  };

  const parseNavigationGuide = (guide: string): NavigationStep[] => {
    const steps: NavigationStep[] = [];

    // Try to parse numbered steps from the markdown
    const stepRegex = /(?:^|\n)(?:#{1,3}\s*)?(?:\*{0,2})?\s*(?:Step\s*)?(\d+)[.:]\s*\*{0,2}([^\n]+)/gi;
    const matches = [...guide.matchAll(stepRegex)];

    if (matches.length >= 2) {
      matches.forEach((match, index) => {
        const stepNumber = parseInt(match[1]);
        const title = match[2].replace(/\*+/g, '').trim();

        // Extract content between this step and the next
        const startIndex = match.index! + match[0].length;
        const endIndex = matches[index + 1]?.index || guide.length;
        const content = guide.slice(startIndex, endIndex).trim();

        // Extract documents mentioned
        const docs: string[] = [];
        const docMatches = content.match(/(?:documents?|need|required|bring)[^:]*:([^.]+)/gi);
        if (docMatches) {
          docMatches.forEach(dm => {
            const items = dm.split(/[,;]/).map(s => s.replace(/(?:documents?|need|required|bring)[^:]*:/i, '').trim());
            docs.push(...items.filter(i => i.length > 3 && i.length < 100));
          });
        }

        // Extract tips
        const tips: string[] = [];
        const tipMatches = content.match(/(?:tip|note|important|remember|warning)[^:]*:([^.]+\.)/gi);
        if (tipMatches) {
          tips.push(...tipMatches.map(t => t.trim()).slice(0, 3));
        }

        // Extract time estimates
        let timeEstimate = "";
        const timeMatch = content.match(/(?:\d+[-–]\d+|\d+)\s*(?:days?|weeks?|hours?|minutes?)/i);
        if (timeMatch) {
          timeEstimate = timeMatch[0];
        }

        steps.push({
          id: `step-${stepNumber}`,
          title,
          description: content.slice(0, 500),
          timeEstimate,
          documents: [...new Set(docs)].slice(0, 5),
          tips: tips.slice(0, 3),
          completed: false
        });
      });
    } else {
      // Fallback: split by sections
      const sections = guide.split(/\n(?=#{1,3}\s|\*\*[A-Z])/);
      sections.forEach((section, index) => {
        if (section.trim().length > 50) {
          const titleMatch = section.match(/^(?:#{1,3}\s*|\*\*)?\s*([^\n*#]+)/);
          steps.push({
            id: `step-${index + 1}`,
            title: titleMatch?.[1]?.trim() || `Step ${index + 1}`,
            description: section.trim(),
            completed: false
          });
        }
      });
    }

    return steps.length > 0 ? steps : [{
      id: 'step-1',
      title: 'Navigation Guide',
      description: guide,
      completed: false
    }];
  };

  const toggleStepComplete = (stepId: string) => {
    if (!currentPathway) return;
    setCurrentPathway(prev =>
      prev?.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      ) || null
    );
  };

  const savePathway = async () => {
    if (!currentPathway || !pathwayTitle) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('saved_navigation_steps')
        .insert({
          user_id: user.id,
          title: pathwayTitle,
          category: selectedCategory || 'custom',
          steps: currentPathway as unknown as Json,
          resources: rawGuide ? { rawGuide } : null
        });

      if (error) throw error;

      toast({
        title: "Pathway Saved",
        description: "You can access this pathway from your saved list",
      });

      setSaveDialogOpen(false);
      loadSavedPathways();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save pathway",
      });
    }
  };

  const loadPathway = (pathway: SavedPathway) => {
    setCurrentPathway(pathway.steps);
    setPathwayTitle(pathway.title);
    setSelectedCategory(pathway.category);
    const savedResources = pathway.resources;
    const savedRawGuide = savedResources
      && typeof savedResources === 'object'
      && !Array.isArray(savedResources)
      && typeof savedResources.rawGuide === 'string'
        ? savedResources.rawGuide
        : null;
    setRawGuide(savedRawGuide);
    setActiveTab("build");

    toast({
      title: "Pathway Loaded",
      description: pathway.title,
    });
  };

  const deletePathway = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_navigation_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedPathways(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Pathway Deleted",
        description: "The pathway has been removed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete pathway",
      });
    }
  };

  const getCompletionStats = () => {
    if (!currentPathway) return { completed: 0, total: 0, percent: 0 };
    const completed = currentPathway.filter(s => s.completed).length;
    const total = currentPathway.length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/professional-home")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Professional Home
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Navigation className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Navigator</h1>
              <p className="text-muted-foreground">Build, track, and save multi-step navigation pathways</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Build Pathway
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Active
              {currentPathway && (
                <Badge variant="secondary" className="ml-1 text-xs">{stats.percent}%</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Saved
              {savedPathways.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{savedPathways.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* BUILD TAB */}
          <TabsContent value="build" className="space-y-6">
            {/* Quick Start Templates */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Quick Start Templates
                </CardTitle>
                <CardDescription>Pre-built pathways for common navigation scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickStartTemplates.map((template) => {
                    const Icon = template.icon;
                    const category = systemCategories.find(c => c.id === template.category);
                    const isTemplateLoading = loadingTemplate === template.title;
                    return (
                      <Card
                        key={template.title}
                        className={`cursor-pointer transition-all ${
                          isTemplateLoading
                            ? 'border-primary bg-primary/5 animate-pulse'
                            : 'hover:border-primary'
                        } ${isLoading && !isTemplateLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => !isLoading && generatePathway(template)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-muted ${category?.color}`}>
                              {isTemplateLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{template.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {isTemplateLoading ? "Generating pathway..." : template.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Custom Pathway Builder */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Custom Pathway Builder</CardTitle>
                <CardDescription>Describe a specific navigation challenge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div>
                  <Label>System Category</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {systemCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id)}
                          className="flex items-center gap-2"
                        >
                          <Icon className={`w-4 h-4 ${selectedCategory !== cat.id ? cat.color : ''}`} />
                          {cat.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Task Description */}
                <div>
                  <Label htmlFor="task">Navigation Task</Label>
                  <Textarea
                    id="task"
                    placeholder="Describe the system navigation you need help with. Be specific about the client's situation and goals..."
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State or ZIP code"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Client Barriers */}
                <div>
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Client Barriers (select all that apply)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    The pathway will include workarounds for selected barriers
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {barriers.map((barrier) => (
                      <div
                        key={barrier.id}
                        className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          barrier.selected ? 'bg-amber-500/10 border-amber-500' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleBarrier(barrier.id)}
                      >
                        <Checkbox
                          checked={barrier.selected}
                          onCheckedChange={() => toggleBarrier(barrier.id)}
                        />
                        <span className="text-sm">{barrier.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => generatePathway()}
                  disabled={isLoading || !customTask.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building Pathway...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Generate Navigation Pathway
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVE TAB */}
          <TabsContent value="active" className="space-y-6">
            {currentPathway ? (
              <>
                {/* Progress Header */}
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{pathwayTitle}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {selectedCategory && (
                            <Badge variant="outline">
                              {systemCategories.find(c => c.id === selectedCategory)?.label || selectedCategory}
                            </Badge>
                          )}
                          <span>{currentPathway.length} steps</span>
                          <span>{stats.completed} completed</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSaveDialogOpen(true)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentPathway(null);
                            setRawGuide(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{stats.percent}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Steps */}
                <div className="space-y-4">
                  {currentPathway.map((step, index) => (
                    <Card
                      key={step.id}
                      className={`border-2 transition-all ${step.completed ? 'bg-green-500/5 border-green-500/30' : ''}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleStepComplete(step.id)}
                            className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              step.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-muted-foreground/30 hover:border-primary'
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-semibold ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {step.title}
                              </h3>
                              {step.timeEstimate && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {step.timeEstimate}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{step.description.slice(0, 300)}</ReactMarkdown>
                            </div>

                            {/* Documents Needed */}
                            {step.documents && step.documents.length > 0 && (
                              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                                <h4 className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                  <FileCheck className="w-4 h-4" />
                                  Documents Needed
                                </h4>
                                <ul className="mt-2 space-y-1">
                                  {step.documents.map((doc, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                      <Circle className="w-2 h-2 fill-current" />
                                      {doc}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Tips */}
                            {step.tips && step.tips.length > 0 && (
                              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                                <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                  <AlertTriangle className="w-4 h-4" />
                                  Tips & Notes
                                </h4>
                                <ul className="mt-2 space-y-1">
                                  {step.tips.map((tip, i) => (
                                    <li key={i} className="text-sm">{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Raw Guide Toggle */}
                {rawGuide && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="raw">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          View Full Raw Guide
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{rawGuide}</ReactMarkdown>
                            </div>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <Navigation className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Pathway</h3>
                  <p className="text-muted-foreground mb-4">
                    Build a new pathway or load one from your saved list
                  </p>
                  <Button onClick={() => setActiveTab("build")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Build New Pathway
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SAVED TAB */}
          <TabsContent value="saved" className="space-y-4">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : savedPathways.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Saved Pathways</h3>
                  <p className="text-muted-foreground">
                    Save pathways to reuse them with future clients
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {savedPathways.map((pathway) => {
                  const category = systemCategories.find(c => c.id === pathway.category);
                  const Icon = category?.icon || FileText;
                  const completedSteps = pathway.steps.filter(s => s.completed).length;

                  return (
                    <Card
                      key={pathway.id}
                      className="border-2 hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-muted ${category?.color || 'text-primary'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{pathway.title}</h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{pathway.steps.length} steps</span>
                                <span>•</span>
                                <span>{completedSteps} completed</span>
                                <span>•</span>
                                <span>{new Date(pathway.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPathway(pathway)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePathway(pathway.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Important Notice */}
        <Card className="mt-8 border-2 bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">ℹ️</span>
                <span><strong className="text-foreground">For guidance only</strong> - Always verify current policies with local agencies</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">ℹ️</span>
                <span><strong className="text-foreground">Privacy</strong> - Never include client names or identifying information in pathways</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Navigation Pathway</DialogTitle>
            <DialogDescription>
              Save this pathway to reuse with future clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="pathway-title">Pathway Title</Label>
              <Input
                id="pathway-title"
                value={pathwayTitle}
                onChange={(e) => setPathwayTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {systemCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePathway} disabled={!pathwayTitle}>
              <Save className="w-4 h-4 mr-2" />
              Save Pathway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
