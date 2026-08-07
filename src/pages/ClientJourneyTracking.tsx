import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import {
  ArrowLeft, Loader2, Users, Plus, CheckCircle,
  Clock, AlertCircle, MapPin, Calendar, ChevronRight
} from "lucide-react";

interface ClientJourney {
  id: string;
  caseId: string;
  status: 'intake' | 'assessment' | 'planning' | 'active' | 'follow-up' | 'closed';
  category: string;
  startDate: string;
  lastUpdated: string;
  milestones: { title: string; completed: boolean; date?: string }[];
  notes: string;
}

const statusColors = {
  intake: 'bg-blue-500',
  assessment: 'bg-purple-500',
  planning: 'bg-amber-500',
  active: 'bg-green-500',
  'follow-up': 'bg-indigo-500',
  closed: 'bg-gray-500'
};

const statusLabels = {
  intake: 'Intake',
  assessment: 'Assessment',
  planning: 'Planning',
  active: 'Active Services',
  'follow-up': 'Follow-up',
  closed: 'Closed'
};

export default function ClientJourneyTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();

  const [journeys, setJourneys] = useState<ClientJourney[]>([
    {
      id: '1',
      caseId: 'HOU-2024-001',
      status: 'active',
      category: 'Housing',
      startDate: '2024-01-15',
      lastUpdated: '2024-02-01',
      milestones: [
        { title: 'Initial intake completed', completed: true, date: '2024-01-15' },
        { title: 'Needs assessment', completed: true, date: '2024-01-18' },
        { title: 'Housing application submitted', completed: true, date: '2024-01-25' },
        { title: 'Interview scheduled', completed: false },
        { title: 'Housing placement', completed: false }
      ],
      notes: 'Client making good progress. Awaiting interview date.'
    },
    {
      id: '2',
      caseId: 'BEN-2024-003',
      status: 'assessment',
      category: 'Benefits',
      startDate: '2024-01-28',
      lastUpdated: '2024-01-30',
      milestones: [
        { title: 'Initial contact', completed: true, date: '2024-01-28' },
        { title: 'Documentation gathered', completed: false },
        { title: 'Application submitted', completed: false },
        { title: 'Approval received', completed: false }
      ],
      notes: 'Need to gather income verification documents.'
    }
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newJourney, setNewJourney] = useState({
    category: '',
    notes: ''
  });

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  const generateCaseId = (category: string) => {
    const prefix = category.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const num = String(journeys.length + 1).padStart(3, '0');
    return `${prefix}-${year}-${num}`;
  };

  const handleCreateJourney = () => {
    if (!newJourney.category) {
      toast({
        variant: "destructive",
        title: "Category Required",
        description: "Please select a category for the journey",
      });
      return;
    }

    const journey: ClientJourney = {
      id: Date.now().toString(),
      caseId: generateCaseId(newJourney.category),
      status: 'intake',
      category: newJourney.category,
      startDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      milestones: [
        { title: 'Initial intake', completed: false },
        { title: 'Needs assessment', completed: false },
        { title: 'Service plan created', completed: false },
        { title: 'Services delivered', completed: false },
        { title: 'Follow-up completed', completed: false }
      ],
      notes: newJourney.notes
    };

    setJourneys([journey, ...journeys]);
    setDialogOpen(false);
    setNewJourney({ category: '', notes: '' });
    toast({
      title: "Journey Created",
      description: `Case ${journey.caseId} has been created`,
    });
  };

  const getProgress = (milestones: ClientJourney['milestones']) => {
    const completed = milestones.filter(m => m.completed).length;
    return (completed / milestones.length) * 100;
  };

  useEffect(() => {
    if (!userLoading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Client Journey Tracking</h1>
                <p className="text-muted-foreground">
                  Anonymous progress tracking without storing PII
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Journey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Client Journey</DialogTitle>
                  <DialogDescription>
                    Create an anonymous case to track progress
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Service Category *</Label>
                    <Select value={newJourney.category} onValueChange={(v) => setNewJourney({...newJourney, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Housing">Housing</SelectItem>
                        <SelectItem value="Benefits">Benefits</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Employment">Employment</SelectItem>
                        <SelectItem value="Food">Food Assistance</SelectItem>
                        <SelectItem value="Legal">Legal Aid</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Notes</Label>
                    <Textarea
                      placeholder="Brief description of the case (no identifying information)"
                      value={newJourney.notes}
                      onChange={(e) => setNewJourney({...newJourney, notes: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleCreateJourney} className="w-full">
                    Create Journey
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">Privacy-First Design</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This system uses anonymous case IDs only. No personal identifying information (names, SSN, DOB, addresses)
                  is stored. All data is tied to randomly generated case numbers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journey List */}
        <div className="space-y-4">
          {journeys.map((journey) => (
            <Card key={journey.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {journey.caseId}
                    </Badge>
                    <Badge className={statusColors[journey.status]}>
                      {statusLabels[journey.status]}
                    </Badge>
                    <Badge variant="secondary">{journey.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Started: {journey.startDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Updated: {journey.lastUpdated}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(getProgress(journey.milestones))}%</span>
                  </div>
                  <Progress value={getProgress(journey.milestones)} className="h-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Milestones</h4>
                    <ul className="space-y-2">
                      {journey.milestones.map((milestone, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          {milestone.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span className={milestone.completed ? 'text-muted-foreground line-through' : ''}>
                            {milestone.title}
                          </span>
                          {milestone.date && (
                            <span className="text-xs text-muted-foreground">({milestone.date})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Notes</h4>
                    <p className="text-sm text-muted-foreground">{journey.notes}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="outline" size="sm">
                    Update Journey
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {journeys.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No client journeys yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "New Journey" to start tracking</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
