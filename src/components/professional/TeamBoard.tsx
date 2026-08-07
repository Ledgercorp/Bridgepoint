import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ClipboardList,
  Plus,
  Trash2,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  Circle,
  PlayCircle,
  MessageSquare,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { useTeamBoard, TeamTask, TaskComment, OrgMember } from '@/hooks/useTeamBoard';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface TeamBoardProps {
  organizationId: string | null;
  userId: string | null;
  organizationName?: string;
}

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: 'bg-slate-500' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'bg-blue-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'bg-green-500' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-500 bg-slate-100' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-100' },
  high: { label: 'High', color: 'text-red-600 bg-red-100' }
};

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  onOpenDetails
}: {
  task: TeamTask;
  onOpenDetails: (task: TeamTask) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isOverdue = task.due_date && !task.completed_at && isPast(parseISO(task.due_date));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onOpenDetails(task)}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <Badge className={`text-xs shrink-0 ml-2 ${PRIORITY_CONFIG[task.priority].color}`}>
              {PRIORITY_CONFIG[task.priority].label}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.due_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
              </span>
            )}
            {(task.comment_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comment_count}
              </span>
            )}
          </div>

          {(task.assignee_name || task.creator_name) && (
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              {task.assignee_name && (
                <p className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {task.assignee_name}
                </p>
              )}
              {task.creator_name && !task.assignee_name && (
                <p>by {task.creator_name}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Task Card for Overlay (while dragging)
function TaskCardOverlay({ task }: { task: TeamTask }) {
  const isOverdue = task.due_date && !task.completed_at && isPast(parseISO(task.due_date));

  return (
    <div className="p-3 rounded-lg border bg-card shadow-xl cursor-grabbing w-[250px]">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        <Badge className={`text-xs shrink-0 ml-2 ${PRIORITY_CONFIG[task.priority].color}`}>
          {PRIORITY_CONFIG[task.priority].label}
        </Badge>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  status,
  title,
  tasks,
  onOpenDetails
}: {
  status: TeamTask['status'];
  title: string;
  tasks: TeamTask[];
  onOpenDetails: (task: TeamTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const config = STATUS_CONFIG[status];

  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[100px] max-h-[400px] overflow-y-auto pr-1 p-2 rounded-lg transition-colors",
          isOver && "bg-primary/10 ring-2 ring-primary/20"
        )}
      >
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isOver ? "Drop here" : "No tasks"}
          </p>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onOpenDetails={onOpenDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TeamBoard({ organizationId, userId, organizationName }: TeamBoardProps) {
  const {
    tasks,
    members,
    loading,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getComments
  } = useTeamBoard(organizationId, userId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<TeamTask | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TeamTask['priority'],
    status: 'todo' as TeamTask['status'],
    due_date: '',
    assigned_to: '' as string
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TeamTask;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TeamTask['status'];

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    await updateTask(taskId, { status: newStatus });
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;

    setIsSubmitting(true);
    const success = await createTask({
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      status: newTask.status,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null
    });

    if (success) {
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '', assigned_to: '' });
      setIsCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (task: TeamTask, status: TeamTask['status']) => {
    const success = await updateTask(task.id, { status });
    if (success && selectedTask?.id === task.id) {
      setSelectedTask({ ...task, status, completed_at: status === 'done' ? new Date().toISOString() : null });
    }
  };

  const handleAssignmentChange = async (task: TeamTask, assigned_to: string | null) => {
    const success = await updateTask(task.id, { assigned_to });
    if (success && selectedTask?.id === task.id) {
      const assignee = members.find(m => m.user_id === assigned_to);
      setSelectedTask({ ...task, assigned_to, assignee_name: assignee?.display_name });
    }
  };

  const openTaskDetails = async (task: TeamTask) => {
    setSelectedTask(task);
    const taskComments = await getComments(task.id);
    setComments(taskComments);
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;

    setIsSubmitting(true);
    const success = await addComment(selectedTask.id, newComment);
    if (success) {
      setNewComment('');
      const taskComments = await getComments(selectedTask.id);
      setComments(taskComments);
    }
    setIsSubmitting(false);
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (!organizationId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Join an organization to use Team Board
          </p>
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
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Team Board</CardTitle>
              <CardDescription>Drag tasks between columns to update status</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Task Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask(prev => ({ ...prev, priority: v as TeamTask['priority'] }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select
                  value={newTask.assigned_to}
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, assigned_to: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.display_name} {member.role === 'admin' ? '(Admin)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!newTask.title.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4 pt-2">
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Select
                    value={selectedTask.status}
                    onValueChange={(v) => handleStatusChange(selectedTask, v as TeamTask['status'])}
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  <Badge className={PRIORITY_CONFIG[selectedTask.priority].color}>
                    {PRIORITY_CONFIG[selectedTask.priority].label}
                  </Badge>

                  {selectedTask.created_by === userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { deleteTask(selectedTask.id); setSelectedTask(null); }}
                      className="ml-auto text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Assigned To</label>
                  <Select
                    value={selectedTask.assigned_to || ''}
                    onValueChange={(v) => handleAssignmentChange(selectedTask, v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {members.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.display_name} {member.role === 'admin' ? '(Admin)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comments */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3">Comments</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No comments yet</p>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="p-2 rounded bg-muted text-sm">
                          <p>{c.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {c.user_name} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add comment..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Kanban Board with Drag & Drop */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              <DroppableColumn
                status="todo"
                title="To Do"
                tasks={todoTasks}
                onOpenDetails={openTaskDetails}
              />
              <DroppableColumn
                status="in_progress"
                title="In Progress"
                tasks={inProgressTasks}
                onOpenDetails={openTaskDetails}
              />
              <DroppableColumn
                status="done"
                title="Done"
                tasks={doneTasks}
                onOpenDetails={openTaskDetails}
              />
            </div>
            <DragOverlay>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
