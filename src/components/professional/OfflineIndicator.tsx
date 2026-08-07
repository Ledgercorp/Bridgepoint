import { Badge } from "@/components/ui/badge";
import { WifiOff, Loader2, AlertCircle } from "lucide-react";

interface OfflineIndicatorProps {
  isFieldModeEnabled: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
}

export function OfflineIndicator({
  isFieldModeEnabled,
  isOnline,
  isSyncing,
  hasPendingChanges,
}: OfflineIndicatorProps) {
  if (!isFieldModeEnabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {/* Field Mode indicator */}
      <Badge
        variant="secondary"
        className={`flex items-center gap-1.5 shadow-lg ${
          isOnline
            ? 'bg-emerald-500/90 text-white border-emerald-600'
            : 'bg-amber-500/90 text-white border-amber-600'
        }`}
      >
        {isSyncing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        Field Mode {isOnline ? '(Online)' : '(Offline)'}
      </Badge>

      {/* Pending changes indicator */}
      {hasPendingChanges && !isSyncing && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 bg-blue-500/90 text-white border-blue-600 shadow-lg"
        >
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>
      )}
    </div>
  );
}
