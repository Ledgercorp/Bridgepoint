import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 5000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustCameOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline && !justCameOnline) return null;

  return (
    <Alert variant={isOffline ? "destructive" : "default"} className="mb-4">
      <div className="flex items-center gap-2">
        {isOffline ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
        <AlertDescription>
          {isOffline ? (
            <span>
              <strong>Offline mode:</strong> Some features may be limited. Your saved items are still available.
            </span>
          ) : (
            <span>
              <strong>You're back online.</strong> Resources have been updated.
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}
