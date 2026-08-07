import { useState } from "react";
import { FolderPlus, Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount?: number;
}

interface CollectionsManagerProps {
  collections: Collection[];
  onCreateCollection: (data: { name: string; description: string; color: string }) => void;
  onDeleteCollection: (id: string) => void;
  onCollectionClick: (collection: Collection) => void;
}

export function CollectionsManager({
  collections,
  onCreateCollection,
  onDeleteCollection,
  onCollectionClick,
}: CollectionsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const handleCreate = () => {
    if (newCollection.name.trim()) {
      onCreateCollection(newCollection);
      setNewCollection({ name: "", description: "", color: "#3b82f6" });
      setIsCreateOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle>Collections</CardTitle>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Organize your items into custom collections
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCollection.name}
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, name: e.target.value })
                    }
                    placeholder="e.g., Important Documents"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newCollection.description}
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, description: e.target.value })
                    }
                    placeholder="What is this collection for?"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    {["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setNewCollection({ ...newCollection, color })}
                          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              newCollection.color === color ? "#000" : "transparent",
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Collection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Organize your saved items</CardDescription>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No collections yet. Create one to start organizing your items!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => onCollectionClick(collection)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${collection.color}20` }}
                  >
                    <Folder className="h-5 w-5" style={{ color: collection.color }} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCollection(collection.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-sm mb-1">{collection.name}</h3>
                {collection.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {collection.description}
                  </p>
                )}
                <Badge variant="secondary" className="text-xs">
                  {collection.itemCount || 0} items
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
