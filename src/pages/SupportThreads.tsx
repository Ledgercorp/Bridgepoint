import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrganizationConnection } from "@/hooks/useOrganizationConnection";
import { useSupportThreads } from "@/hooks/useSupportThreads";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Send, AlertCircle, CheckCircle,
  Clock, Plus, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ThreadMessage {
  id: string;
  sender_type: 'community' | 'staff';
  message_content: string;
  created_at: string;
  user_profiles?: {
    display_name: string | null;
    first_name: string | null;
  };
}

export default function SupportThreads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, organizationId, organizationName, loading: connectionLoading } = useOrganizationConnection();
  const { threads, loading: threadsLoading, createThread, sendMessage, closeThread } = useSupportThreads(organizationId || undefined);

  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [newThreadMessage, setNewThreadMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`thread-${selectedThread}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'thread_messages',
            filter: `thread_id=eq.${selectedThread}`
          },
          () => {
            loadMessages(selectedThread);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedThread]);

  const loadMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('thread_messages')
        .select(`
          *,
          user_profiles:sender_id (
            display_name,
            first_name
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at');

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadSubject.trim() || !newThreadMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and initial message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const threadId = await createThread(newThreadSubject, newThreadMessage);
    setSending(false);

    if (threadId) {
      setShowNewThread(false);
      setNewThreadSubject("");
      setNewThreadMessage("");
      setSelectedThread(threadId);
      toast({
        title: "Thread Created",
        description: "Your support thread has been created",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    const success = await sendMessage(selectedThread, newMessage);
    setSending(false);

    if (success) {
      setNewMessage("");
      loadMessages(selectedThread);
    }
  };

  if (connectionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Not Connected
              </CardTitle>
              <CardDescription>
                You must be connected to an organization to access support threads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/community-home")}>
                Connect to an Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            Support Threads
          </h1>
          <p className="text-muted-foreground mt-1">
            Get help from {organizationName}
          </p>
        </div>

        {/* Safety Notice */}
        <Card className="mb-6 border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-blue-900 dark:text-blue-100">
                  Safety & Privacy Protected
                </div>
                <p className="text-blue-800 dark:text-blue-200">
                  All messages are monitored by Solace AI to protect your privacy. Do not share:
                  full names, phone numbers, addresses, medical information, or other identifying details.
                  Messages containing sensitive information will be automatically blocked.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Threads List */}
          <div className="md:col-span-1 space-y-4">
            <Button
              onClick={() => setShowNewThread(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Button>

            <div className="space-y-2">
              {threadsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No threads yet
                </div>
              ) : (
                threads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer transition-colors ${
                      selectedThread === thread.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm line-clamp-1">
                          {thread.subject}
                        </div>
                        <Badge variant={thread.status === 'open' ? 'default' : 'secondary'} className="ml-2">
                          {thread.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(thread.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="md:col-span-2">
            {showNewThread ? (
              <Card>
                <CardHeader>
                  <CardTitle>New Support Thread</CardTitle>
                  <CardDescription>
                    Describe your need in general terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={newThreadSubject}
                      onChange={(e) => setNewThreadSubject(e.target.value)}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={newThreadMessage}
                      onChange={(e) => setNewThreadMessage(e.target.value)}
                      placeholder="Describe your situation in general terms (no personal details)"
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateThread}
                      disabled={sending}
                    >
                      {sending ? "Creating..." : "Create Thread"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewThread(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedThread ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {threads.find(t => t.id === selectedThread)?.subject}
                      </CardTitle>
                      <CardDescription>
                        Support thread with {organizationName}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeThread(selectedThread)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close Thread
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isStaff = message.sender_type === 'staff';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          isStaff
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          <div className="text-xs font-medium mb-1">
                            {isStaff ? `${organizationName} Staff` : 'You'}
                          </div>
                          <div className="text-sm">{message.message_content}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <Separator />
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message (no personal details)"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a thread or create a new one</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
