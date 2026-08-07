import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  Plus,
  Trash2,
  Users,
  Clock,
  Share2,
  FileText,
  Link,
  MapPin,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useORES, SharedResource } from '@/hooks/useORES';
import { formatDistanceToNow } from 'date-fns';

interface ORESPanelProps {
  organizationId: string | null;
  organizationName?: string;
  isAdmin?: boolean;
}

const RESOURCE_TYPES = [
  { value: 'resource', label: 'Resource', icon: FileText },
  { value: 'link', label: 'Quick Link', icon: Link },
  { value: 'location', label: 'Location', icon: MapPin },
  { value: 'contact', label: 'Contact Info', icon: Users }
];

export function ORESPanel({ organizationId, organizationName, isAdmin }: ORESPanelProps) {
  const {
    sharedResources,
    loading,
    syncing,
    lastSyncTime,
    shareResource,
    removeResource,
    refreshResources
  } = useORES(organizationId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    resource_type: 'resource',
    notes: '',
    url: '',
    address: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddResource = async () => {
    if (!newResource.title.trim()) return;

    setIsSubmitting(true);
    const resourceData: Record<string, unknown> = {};

    if (newResource.url) resourceData.url = newResource.url;
    if (newResource.address) resourceData.address = newResource.address;
    if (newResource.phone) resourceData.phone = newResource.phone;

    const success = await shareResource({
      title: newResource.title,
      resource_type: newResource.resource_type,
      resource_data: resourceData,
      notes: newResource.notes || null,
      is_active: true
    });

    if (success) {
      setNewResource({ title: '', resource_type: 'resource', notes: '', url: '', address: '', phone: '' });
      setIsAddDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    if (confirm('Remove this shared resource?')) {
      await removeResource(id);
    }
  };

  const getResourceIcon = (type: string) => {
    const found = RESOURCE_TYPES.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  if (!organizationId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Join or create an organization to use ORES
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
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ORES</CardTitle>
              <p className="text-xs text-muted-foreground">
                Organizational Resource Ecosystem Sync
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3 text-green-500" />
              Live
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshResources}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {lastSyncTime && (
          <p className="text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3 inline mr-1" />
            Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{sharedResources.length} shared</span>
          </div>
          {organizationName && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{organizationName}</span>
            </div>
          )}
        </div>

        {/* Add Resource Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Share Resource with Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Resource with Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newResource.title}
                  onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newResource.resource_type}
                  onValueChange={(value) => setNewResource(prev => ({ ...prev, resource_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newResource.resource_type === 'link' || newResource.resource_type === 'resource') && (
                <div>
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={newResource.url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              )}

              {newResource.resource_type === 'location' && (
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={newResource.address}
                    onChange={(e) => setNewResource(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St..."
                  />
                </div>
              )}

              {newResource.resource_type === 'contact' && (
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newResource.phone}
                    onChange={(e) => setNewResource(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newResource.notes}
                  onChange={(e) => setNewResource(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the team..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAddResource}
                disabled={!newResource.title.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Share with Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resource List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sharedResources.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shared resources yet</p>
            <p className="text-xs">Share resources for your whole team to access</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {sharedResources.map((resource) => {
              const Icon = getResourceIcon(resource.resource_type);
              const resourceData = resource.resource_data || {};

              return (
                <div
                  key={resource.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{resource.title}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {RESOURCE_TYPES.find(t => t.value === resource.resource_type)?.label || 'Resource'}
                      </Badge>
                    </div>
                    {resource.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {resource.notes}
                      </p>
                    )}
                    {resourceData.url && (
                      <a
                        href={resourceData.url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 block truncate"
                      >
                        {resourceData.url as string}
                      </a>
                    )}
                    {resourceData.address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {resourceData.address as string}
                      </p>
                    )}
                    {resourceData.phone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📞 {resourceData.phone as string}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Shared by {resource.sharer_name} • {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(resource.id)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
