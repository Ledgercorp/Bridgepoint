import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, Plus, Lock, Globe, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { useUserMode } from "@/hooks/useUserMode";

interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  is_private: boolean;
  created_at: string;
  moderation_mode: string;
  participant_count?: number;
}

const StudyRooms = () => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    topic: "",
    is_private: false,
    moderation_mode: "auto" as "auto" | "manual",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isEduVerified, currentMode, loading: userLoading, isAdmin } = useUserMode();

  // Study Rooms is student-only (admins can bypass)
  const hasAccess = isAdmin || (isEduVerified && currentMode === "student");

  useEffect(() => {
    if (!userLoading && !hasAccess) {
      navigate("/community-home");
      return;
    }
    if (!userLoading) {
      fetchRooms();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('study-rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    }
  }, [userLoading, hasAccess, navigate]);

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error } = await supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('study_room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return { ...room, participant_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .insert({
          name: newRoom.name,
          description: newRoom.description || null,
          topic: newRoom.topic || null,
          is_private: newRoom.is_private,
          created_by: user.id,
          moderator_id: user.id,
          moderation_mode: newRoom.moderation_mode,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Automatically join the room as creator
      const { error: joinError } = await supabase
        .from('study_room_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      if (joinError) throw joinError;

      toast({
        title: "Success",
        description: "Study room created!",
      });

      setIsDialogOpen(false);
      setNewRoom({ name: "", description: "", topic: "", is_private: false, moderation_mode: "auto" });
      navigate(`/study-room/${room.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if room requires manual moderation
      const { data: room } = await supabase
        .from('study_rooms')
        .select('moderation_mode')
        .eq('id', roomId)
        .single();

      if (room?.moderation_mode === 'manual') {
        // Submit join request for approval
        const { error } = await supabase
          .from('pending_study_participants')
          .insert({
            room_id: roomId,
            user_id: user.id,
          });

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Request Pending",
              description: "Your join request is awaiting moderator approval",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Request Submitted",
          description: "Waiting for moderator approval to join this room",
        });
      } else {
        // Auto-approve for auto-moderated rooms
        const { error } = await supabase
          .from('study_room_participants')
          .insert({
            room_id: roomId,
            user_id: user.id,
          });

        if (error) {
          if (error.code === '23505') {
            navigate(`/study-room/${roomId}`);
            return;
          }
          throw error;
        }

        toast({
          title: "Success",
          description: "Joined study room!",
        });

        navigate(`/study-room/${roomId}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <p>Loading study rooms...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Study Rooms</h1>
            <p className="text-muted-foreground">Collaborate with fellow students</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Room</DialogTitle>
                <DialogDescription>
                  Set up a collaborative space for studying
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Biology Finals Prep"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Cell Biology, Chapter 5-8"
                    value={newRoom.topic}
                    onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will you study together?"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="private">Private Room</Label>
                    <p className="text-sm text-muted-foreground">
                      Only invited members can join
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={newRoom.is_private}
                    onCheckedChange={(checked) => setNewRoom({ ...newRoom, is_private: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="moderation">Manual Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Approve members before they can join
                    </p>
                  </div>
                  <Switch
                    id="moderation"
                    checked={newRoom.moderation_mode === "manual"}
                    onCheckedChange={(checked) => setNewRoom({ ...newRoom, moderation_mode: checked ? "manual" : "auto" })}
                  />
                </div>
                <Button onClick={createRoom} className="w-full">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {room.is_private ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                      {room.name}
                      {room.moderation_mode === 'manual' && (
                        <Badge variant="outline" className="ml-2">
                          <Shield className="w-3 h-3 mr-1" />
                          Moderated
                        </Badge>
                      )}
                    </CardTitle>
                    {room.topic && (
                      <p className="text-sm text-muted-foreground mt-1">{room.topic}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {room.description && (
                  <CardDescription className="mb-4 line-clamp-2">
                    {room.description}
                  </CardDescription>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{room.participant_count || 0} member{room.participant_count !== 1 ? 's' : ''}</span>
                  </div>
                  <Button size="sm" onClick={() => joinRoom(room.id)}>
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No study rooms yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a collaborative study space!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyRooms;
