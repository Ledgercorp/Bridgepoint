import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, FileText, Zap, Clock, GraduationCap, FolderOpen, Pin, MoreVertical, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReminders } from "@/hooks/useReminders";
import { RemindersSection } from "@/components/hub/RemindersSection";
import { SearchFilter } from "@/components/hub/SearchFilter";
import { ProgressStats } from "@/components/hub/ProgressStats";
import { PinnedItems } from "@/components/hub/PinnedItems";
import { CollectionsManager } from "@/components/hub/CollectionsManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SavedItem {
  id: string;
  title: string;
  category?: string;
  created_at: string;
}

interface RecentActivity {
  id: string;
  item_title: string;
  activity_type: string;
  created_at: string;
}

interface PinnedItem {
  id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  pinned_at: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount?: number;
}

export default function MyHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, currentMode, isEduVerified, loading: userLoading } = useUserMode();
  const [savedSteps, setSavedSteps] = useState<SavedItem[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<SavedItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("date-desc");
  const { pendingReminders, completeReminder } = useReminders(user?.id);

  // Filter and sort logic - MUST be before any conditional returns
  const filteredSteps = useMemo(() => {
    let filtered = savedSteps;

    if (searchQuery) {
      filtered = filtered.filter((step) =>
        step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (step.category && step.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((step) =>
        step.category && selectedCategories.includes(step.category)
      );
    }

    if (sortBy === "date-asc") {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "date-desc") {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "title") {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [savedSteps, searchQuery, selectedCategories, sortBy]);

  const filteredDocuments = useMemo(() => {
    let filtered = savedDocuments;

    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "date-asc") {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "date-desc") {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "title") {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [savedDocuments, searchQuery, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSaved = savedSteps.length + savedDocuments.length;
    const recentActivityCount = recentActivity.filter((a) => {
      const daysDiff = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    const completedReminders = pendingReminders.filter((r) => r.is_completed).length;

    // Calculate streak (consecutive days with activity)
    const sortedActivity = [...recentActivity].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const activity of sortedActivity) {
      const activityDate = new Date(activity.created_at);
      activityDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return {
      totalSaved,
      recentActivity: recentActivityCount,
      completedReminders,
      streakDays: streak,
    };
  }, [savedSteps, savedDocuments, recentActivity, pendingReminders]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    savedSteps.forEach((step) => {
      if (step.category) categories.add(step.category);
    });
    return Array.from(categories);
  }, [savedSteps]);

  useEffect(() => {
    // Wait for user loading to complete before checking auth
    if (userLoading) return;

    if (user) {
      fetchUserData();
    } else {
      navigate("/auth");
    }
  }, [user, userLoading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch saved navigation steps
      const { data: steps, error: stepsError } = await supabase
        .from("saved_navigation_steps")
        .select("id, title, category, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (stepsError) throw stepsError;
      setSavedSteps(steps || []);

      // Fetch saved documents
      const { data: docs, error: docsError } = await supabase
        .from("saved_documents")
        .select("id, document_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (docsError) throw docsError;
      setSavedDocuments(docs?.map(d => ({ ...d, title: d.document_name })) || []);

      // Fetch recent activity
      const { data: activity, error: activityError } = await supabase
        .from("recent_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (activityError) throw activityError;
      setRecentActivity(activity || []);

      // Fetch pinned items
      const { data: pinned, error: pinnedError } = await supabase
        .from("pinned_items")
        .select("*")
        .eq("user_id", user.id)
        .order("pinned_at", { ascending: false });

      if (pinnedError) throw pinnedError;
      setPinnedItems(pinned || []);

      // Fetch collections with item counts
      const { data: cols, error: colsError } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (colsError) throw colsError;

      // Get item counts for each collection
      const collectionsWithCounts = await Promise.all(
        (cols || []).map(async (col) => {
          const { count } = await supabase
            .from("collection_items")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", col.id);
          return { ...col, itemCount: count || 0 };
        })
      );

      setCollections(collectionsWithCounts);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Handler functions
  const handleCompleteReminder = async (reminderId: string) => {
    await completeReminder(reminderId);
    toast({ title: "Reminder completed!" });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await supabase.from("task_reminders").delete().eq("id", reminderId);
      toast({ title: "Reminder deleted" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete reminder" });
    }
  };

  const handlePinItem = async (itemType: string, itemId: string, itemTitle: string) => {
    try {
      await supabase.from("pinned_items").insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        item_title: itemTitle,
      });
      toast({ title: "Item pinned!" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to pin item" });
    }
  };

  const handleUnpin = async (pinnedId: string) => {
    try {
      await supabase.from("pinned_items").delete().eq("id", pinnedId);
      toast({ title: "Item unpinned" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to unpin item" });
    }
  };

  const handleCreateCollection = async (data: { name: string; description: string; color: string }) => {
    try {
      await supabase.from("collections").insert({
        user_id: user.id,
        ...data,
      });
      toast({ title: "Collection created!" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create collection" });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await supabase.from("collections").delete().eq("id", collectionId);
      toast({ title: "Collection deleted" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete collection" });
    }
  };

  const handleDeleteItem = async (itemType: string, itemId: string) => {
    try {
      const table = itemType === "navigation_step" ? "saved_navigation_steps" : "saved_documents";
      await supabase.from(table).delete().eq("id", itemId);
      toast({ title: "Item deleted" });
      fetchUserData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            if (currentMode === "student") navigate("/student-home");
            else if (currentMode === "instructor") navigate("/instructor-home");
            else if (currentMode === "professional") navigate("/professional-home");
            else navigate("/community-home");
          }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">My Hub</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome to Your Personal Hub</CardTitle>
            <CardDescription>
              Everything you've saved, viewed, and worked on—all in one calm, organized place
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Progress Stats */}
        <ProgressStats {...stats} />

        {/* Reminders Section */}
        <RemindersSection
          reminders={pendingReminders}
          onComplete={handleCompleteReminder}
          onDelete={handleDeleteReminder}
        />

        {/* Pinned Items */}
        <PinnedItems
          items={pinnedItems}
          onUnpin={handleUnpin}
          onItemClick={(item) => {
            if (item.item_type === "document") {
              navigate("/document-safe-box");
            }
          }}
        />

        {/* Collections Manager */}
        <CollectionsManager
          collections={collections}
          onCreateCollection={handleCreateCollection}
          onDeleteCollection={handleDeleteCollection}
          onCollectionClick={(collection) => {
            toast({ title: `Opening ${collection.name}`, description: "Collection view coming soon!" });
          }}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/im-overwhelmed")}
          >
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">I'm Overwhelmed</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/quick-tasks")}
          >
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Quick Tasks</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/document-safe-box")}
          >
            <FolderOpen className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Document Safe Box</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/resource-passport")}
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">My Passport</span>
          </Button>

          {isEduVerified && currentMode === "student" && (
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/mini-lessons")}
            >
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Mini Lessons</span>
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading your hub...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="saved" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="saved">Saved Items</TabsTrigger>
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <SearchFilter
                onSearchChange={setSearchQuery}
                onCategoryFilter={setSelectedCategories}
                onSortChange={setSortBy}
                availableCategories={availableCategories}
              />
            </div>

            <TabsContent value="saved" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Saved Step-by-Step Guides</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSteps.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {searchQuery || selectedCategories.length > 0
                        ? "No guides match your filters"
                        : "No saved guides yet. Use 'Save These Steps' when you find helpful instructions."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredSteps.map((step) => {
                        const isPinned = pinnedItems.some(
                          (p) => p.item_type === "navigation_step" && p.item_id === step.id
                        );
                        return (
                          <div
                            key={step.id}
                            className="group p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{step.title}</h3>
                                {step.category && (
                                  <p className="text-sm text-muted-foreground">{step.category}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Saved {new Date(step.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!isPinned && (
                                    <DropdownMenuItem
                                      onClick={() => handlePinItem("navigation_step", step.id, step.title)}
                                    >
                                      <Pin className="h-4 w-4 mr-2" />
                                      Pin Item
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteItem("navigation_step", step.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Activity</CardTitle>
                  </div>
                  <CardDescription>
                    Tasks you've used and resources you've viewed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity yet. Start exploring resources and tasks!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 border-l-4 border-primary/20 bg-muted/30 rounded"
                        >
                          <p className="text-sm font-medium">{activity.item_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <CardTitle>Your Saved Documents</CardTitle>
                  </div>
                  <CardDescription>
                    IDs, insurance cards, and important documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {searchQuery
                        ? "No documents match your search"
                        : "No documents saved yet. Visit the Document Safe Box to start storing important files."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredDocuments.map((doc) => {
                        const isPinned = pinnedItems.some(
                          (p) => p.item_type === "document" && p.item_id === doc.id
                        );
                        return (
                          <div
                            key={doc.id}
                            className="group p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => navigate("/document-safe-box")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <h3 className="font-semibold">{doc.title}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Added {new Date(doc.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!isPinned && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePinItem("document", doc.id, doc.title);
                                      }}
                                    >
                                      <Pin className="h-4 w-4 mr-2" />
                                      Pin Item
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteItem("document", doc.id);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {currentMode === "student" && (
          <Alert className="mt-6">
            <AlertDescription>
              <strong>Student Mode:</strong> All items here are for educational learning only.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}
