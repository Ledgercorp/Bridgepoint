import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FieldModeToggleProps {
  isEnabled: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  hasPendingChanges: boolean;
  onToggle: () => void;
  onForceSync: () => void;
  isLocked?: boolean;
}

export function FieldModeToggle({
  isEnabled,
  isOnline,
  isSyncing,
  lastSynced,
  hasPendingChanges,
  onToggle,
  onForceSync,
  isLocked = false,
}: FieldModeToggleProps) {
  return (
    <Card className={`border-2 transition-all ${isEnabled ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-muted'} ${isLocked ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/20' : 'bg-muted'}`}>
              <WifiOff className={`h-5 w-5 ${isEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Field Mode
                {isEnabled && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                  >
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {isLocked ? 'Requires active subscription' : 'Offline-first toolkit for outreach'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              disabled={isSyncing || isLocked}
            />
          </div>
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="pt-0 space-y-3">
          {/* Status indicators */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Online/Offline status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
              isOnline ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'
            }`}>
              {isOnline ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Pending changes */}
            {hasPendingChanges && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/20 text-blue-700">
                <AlertCircle className="h-3 w-3" />
                Changes pending sync
              </div>
            )}

            {/* Last synced */}
            {lastSynced && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                <Clock className="h-3 w-3" />
                Synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
              </div>
            )}
          </div>

          {/* Sync button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onForceSync}
              disabled={!isOnline || isSyncing}
              className="flex-1"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Syncing...' : 'Refresh Cache'}
            </Button>
          </div>

          {/* Info about what's cached */}
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>Resource Bundles, Programs & Events cached for offline access</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
