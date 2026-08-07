import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Megaphone, AlertCircle, Info, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BroadcastManagerProps {
  organizationId: string;
}

type Broadcast = Database['public']['Tables']['organization_broadcasts']['Row'];

export const BroadcastManager = ({ organizationId }: BroadcastManagerProps) => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'announcement' | 'alert' | 'update'>('announcement');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBroadcasts();
  }, [organizationId]);

  const loadBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_broadcasts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBroadcasts(data || []);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
      toast({
        title: "Error",
        description: "Failed to load broadcasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter both a title and message",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

      const { error } = await supabase
        .from('organization_broadcasts')
        .insert({
          organization_id: organizationId,
          title: title.trim(),
          message: message.trim(),
          broadcast_type: broadcastType,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Broadcast Created",
        description: "Your message has been broadcast to all connected users",
      });

      setTitle('');
      setMessage('');
      setBroadcastType('announcement');
      setExpiresInDays('7');
      setDialogOpen(false);
      loadBroadcasts();
    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to create broadcast",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteBroadcast = async (id: string) => {
    if (!confirm('Delete this broadcast?')) return;

    try {
      const { error } = await supabase
        .from('organization_broadcasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Broadcast Deleted",
        description: "The broadcast has been removed",
      });

      loadBroadcasts();
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to delete broadcast",
        variant: "destructive",
      });
    }
  };

  const getBroadcastIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'update':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBroadcastColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'border-red-200 bg-red-50/50';
      case 'update':
        return 'border-green-200 bg-green-50/50';
      default:
        return 'border-blue-200 bg-blue-50/50';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Broadcast Announcements</CardTitle>
              <CardDescription>
                Send updates and alerts to all connected community users
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Megaphone className="w-4 h-4 mr-2" />
                  New Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Broadcast</DialogTitle>
                  <DialogDescription>
                    Send a message to all users connected to your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Broadcast Type</Label>
                    <Select value={broadcastType} onValueChange={(value) => setBroadcastType(value as typeof broadcastType)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Announcement
                          </div>
                        </SelectItem>
                        <SelectItem value="alert">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Alert
                          </div>
                        </SelectItem>
                        <SelectItem value="update">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Update
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Broadcast title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Your message to community users..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires In (Days)</Label>
                    <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                      <SelectTrigger id="expires">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={createBroadcast} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Broadcast"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No broadcasts yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first broadcast to communicate with community users
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => {
                const isExpired = new Date(broadcast.expires_at) < new Date();
                return (
                  <Card key={broadcast.id} className={getBroadcastColor(broadcast.broadcast_type)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getBroadcastIcon(broadcast.broadcast_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{broadcast.title}</CardTitle>
                              <Badge variant={isExpired ? "secondary" : "default"}>
                                {isExpired ? "Expired" : broadcast.broadcast_type}
                              </Badge>
                            </div>
                            <CardDescription className="whitespace-pre-wrap">
                              {broadcast.message}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBroadcast(broadcast.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {format(new Date(broadcast.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {format(new Date(broadcast.expires_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
