import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Plus,
  Trash2,
  Share2,
  Users,
  Clock,
  Loader2,
  FileText,
  Copy,
  BarChart3
} from 'lucide-react';
import { useWorkflowLibrary, WorkflowTemplate } from '@/hooks/useWorkflowLibrary';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface WorkflowLibraryProps {
  userId: string | null;
  organizationId: string | null;
  organizationName?: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'intake', label: 'Client Intake' },
  { value: 'benefits', label: 'Benefits Application' },
  { value: 'housing', label: 'Housing' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'employment', label: 'Employment' },
  { value: 'crisis', label: 'Crisis Response' }
];

export function WorkflowLibrary({ userId, organizationId, organizationName }: WorkflowLibraryProps) {
  const {
    workflows,
    sharedWorkflows,
    loading,
    saveWorkflow,
    deleteWorkflow,
    shareWorkflow
  } = useWorkflowLibrary(userId, organizationId);
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    title: '',
    description: '',
    category: 'general',
    steps: [{ title: '', description: '' }]
  });

  const handleAddStep = () => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, { title: '', description: '' }]
    }));
  };

  const handleUpdateStep = (index: number, field: 'title' | 'description', value: string) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleRemoveStep = (index: number) => {
    if (newWorkflow.steps.length > 1) {
      setNewWorkflow(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreate = async () => {
    if (!newWorkflow.title.trim()) return;

    setIsSubmitting(true);
    const success = await saveWorkflow({
      organization_id: null,
      title: newWorkflow.title,
      description: newWorkflow.description || null,
      category: newWorkflow.category,
      workflow_data: { steps: newWorkflow.steps.filter(s => s.title.trim()) },
      is_shared: false
    });

    if (success) {
      setNewWorkflow({ title: '', description: '', category: 'general', steps: [{ title: '', description: '' }] });
      setIsCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleShare = async (workflow: WorkflowTemplate) => {
    if (!organizationId) {
      toast({ title: 'No organization', description: 'Join an organization to share workflows', variant: 'destructive' });
      return;
    }
    await shareWorkflow(workflow.id, organizationId);
  };

  const handleCopy = (workflow: WorkflowTemplate) => {
    const text = `${workflow.title}\n\n${workflow.description || ''}\n\nSteps:\n${
      (workflow.workflow_data.steps || []).map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')
    }`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Workflow copied to clipboard' });
  };

  const renderWorkflowCard = (workflow: WorkflowTemplate, showShareButton = false) => (
    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{workflow.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {CATEGORIES.find(c => c.value === workflow.category)?.label || workflow.category}
              </Badge>
            </div>
            {workflow.description && (
              <CardDescription className="line-clamp-2">{workflow.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Steps Preview */}
        {workflow.workflow_data.steps && workflow.workflow_data.steps.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">
              {workflow.workflow_data.steps.length} step{workflow.workflow_data.steps.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {workflow.workflow_data.steps.slice(0, 3).map((step, i) => (
                <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>
              ))}
              {workflow.workflow_data.steps.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{workflow.workflow_data.steps.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true })}
          </span>
          {workflow.use_count > 0 && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Used {workflow.use_count}x
            </span>
          )}
          {workflow.creator_name && workflow.created_by !== userId && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {workflow.creator_name}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCopy(workflow)}>
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          {showShareButton && !workflow.is_shared && organizationId && (
            <Button variant="outline" size="sm" onClick={() => handleShare(workflow)}>
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          )}
          {workflow.created_by === userId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteWorkflow(workflow.id)}
              className="text-destructive hover:text-destructive ml-auto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Workflow Library</CardTitle>
              <CardDescription>Save and share common workflows</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workflow Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newWorkflow.title}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., SNAP Application Process"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newWorkflow.category}
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this workflow..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Steps</label>
                <div className="space-y-3">
                  {newWorkflow.steps.map((step, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-2">
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={step.title}
                          onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                          placeholder="Step title"
                        />
                        <Input
                          value={step.description}
                          onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                          placeholder="Step description (optional)"
                        />
                      </div>
                      {newWorkflow.steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(index)}
                          className="text-destructive mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleAddStep} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!newWorkflow.title.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs for My/Shared workflows */}
        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mine">My Workflows ({workflows.length})</TabsTrigger>
            <TabsTrigger value="shared">Team Shared ({sharedWorkflows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-3 mt-4">
            {workflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved workflows yet</p>
              </div>
            ) : (
              workflows.map(w => renderWorkflowCard(w, true))
            )}
          </TabsContent>

          <TabsContent value="shared" className="space-y-3 mt-4">
            {!organizationId ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Join an organization to see shared workflows</p>
              </div>
            ) : sharedWorkflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No shared workflows from {organizationName || 'your team'}</p>
              </div>
            ) : (
              sharedWorkflows.map(w => renderWorkflowCard(w))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
