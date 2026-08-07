import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Users, FileText, BookOpen, Send, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { ModeratorPanel } from "@/components/student/ModeratorPanel";

interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  moderator_id: string;
  moderation_mode: string;
}

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  };
}

interface Note {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  };
}

const StudyRoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    fetchRoomData();

    // Subscribe to realtime updates
    const notesChannel = supabase
      .channel(`room-${roomId}-notes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shared_study_notes', filter: `room_id=eq.${roomId}` },
        () => fetchNotes()
      )
      .subscribe();

    const participantsChannel = supabase
      .channel(`room-${roomId}-participants`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_participants', filter: `room_id=eq.${roomId}` },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      await Promise.all([
        fetchRoom(),
        fetchParticipants(),
        fetchNotes(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoom = async () => {
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', roomId!)
      .single();

    if (error) throw error;
    setRoom(data);

    // Check if current user is moderator
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data.moderator_id === user.id) {
      setIsModerator(true);
    }
  };

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('study_room_participants')
      .select('*')
      .eq('room_id', roomId!)
      .order('joined_at');

    if (error) throw error;

    // Fetch user profiles separately
    const participantsWithProfiles = await Promise.all(
      (data || []).map(async (participant) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, email')
          .eq('user_id', participant.user_id)
          .maybeSingle();

        return {
          ...participant,
          profiles: profile || { display_name: null, email: '' }
        };
      })
    );

    setParticipants(participantsWithProfiles);
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('shared_study_notes')
      .select('*')
      .eq('room_id', roomId!)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user profiles separately
    const notesWithProfiles = await Promise.all(
      (data || []).map(async (note) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, email')
          .eq('user_id', note.user_id)
          .maybeSingle();

        return {
          ...note,
          profiles: profile || { display_name: null, email: '' }
        };
      })
    );

    setNotes(notesWithProfiles);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('shared_study_notes')
        .insert({
          room_id: roomId!,
          user_id: user.id,
          content: newNote,
        });

      if (error) throw error;

      setNewNote("");
      toast({
        title: "Success",
        description: "Note added!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const leaveRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('study_room_participants')
        .delete()
        .eq('room_id', roomId!)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left study room",
      });

      navigate('/study-rooms');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <p>Room not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/study-rooms')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
          {room.topic && (
            <p className="text-muted-foreground">{room.topic}</p>
          )}
          {room.description && (
            <p className="text-sm text-muted-foreground mt-2">{room.description}</p>
          )}
        </div>

        <Tabs defaultValue="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="notes">
                <FileText className="w-4 h-4 mr-2" />
                Shared Notes
              </TabsTrigger>
              <TabsTrigger value="participants">
                <Users className="w-4 h-4 mr-2" />
                Members ({participants.length})
              </TabsTrigger>
              {isModerator && room?.moderation_mode === 'manual' && (
                <TabsTrigger value="moderation">
                  <Shield className="w-4 h-4 mr-2" />
                  Moderation
                </TabsTrigger>
              )}
              <TabsTrigger value="resources">
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
            <Button variant="destructive" onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add a Note</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Share your notes, insights, or questions..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        addNote();
                      }
                    }}
                  />
                  <Button onClick={addNote} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Ctrl+Enter to send
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">
                        {note.profiles?.display_name || note.profiles?.email || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
              {notes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No notes yet. Be the first to share!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">
                          {participant.profiles?.display_name || participant.profiles?.email || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(participant.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isModerator && room?.moderation_mode === 'manual' && (
            <TabsContent value="moderation">
              <ModeratorPanel roomId={roomId!} />
            </TabsContent>
          )}

          <TabsContent value="resources">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  Resource sharing coming soon!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyRoomDetail;
