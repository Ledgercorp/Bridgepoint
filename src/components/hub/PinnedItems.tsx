import { Pin, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PinnedItem {
  id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  pinned_at: string;
}

interface PinnedItemsProps {
  items: PinnedItem[];
  onUnpin: (id: string) => void;
  onItemClick: (item: PinnedItem) => void;
}

export function PinnedItems({ items, onUnpin, onItemClick }: PinnedItemsProps) {
  if (items.length === 0) {
    return null;
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "navigation_step":
        return "Guide";
      case "document":
        return "Document";
      case "life_task":
        return "Task";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" />
          <CardTitle>Pinned Items</CardTitle>
        </div>
        <CardDescription>Quick access to your most important items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
              onClick={() => onItemClick(item)}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(item.id);
                }}
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
              <Badge variant="secondary" className="mb-2">
                {getItemTypeLabel(item.item_type)}
              </Badge>
              <p className="font-medium text-sm line-clamp-2">{item.item_title}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
