import { useState, useEffect, useCallback } from "react";
import { offlineStorage } from "@/utils/offlineStorage";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ResourceBundle = Database['public']['Tables']['resource_bundles']['Row'];
type WorkflowTemplate = Database['public']['Tables']['workflow_templates']['Row'];
type OrganizationProgram = Database['public']['Tables']['organization_programs']['Row'];
type OrganizationEvent = Database['public']['Tables']['organization_events']['Row'];

interface FieldModeData {
  bundles: ResourceBundle[];
  workflows: WorkflowTemplate[];
  programs: OrganizationProgram[];
  events: OrganizationEvent[];
  lastSynced: number | null;
}

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, Json | undefined>;
  timestamp: number;
}

export function useFieldMode(userId: string | null) {
  const { toast } = useToast();
  const [isFieldModeEnabled, setIsFieldModeEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [cachedData, setCachedData] = useState<FieldModeData>({
    bundles: [],
    workflows: [],
    programs: [],
    events: [],
    lastSynced: null,
  });
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // Check field mode preference from localStorage
  useEffect(() => {
    const savedFieldMode = localStorage.getItem("fieldModeEnabled");
    if (savedFieldMode === "true") {
      setIsFieldModeEnabled(true);
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isFieldModeEnabled) {
        syncPendingChanges();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isFieldModeEnabled]);

  // Toggle field mode
  const toggleFieldMode = useCallback(async () => {
    const newValue = !isFieldModeEnabled;
    setIsFieldModeEnabled(newValue);
    localStorage.setItem("fieldModeEnabled", String(newValue));

    if (newValue && isOnline) {
      // Entering field mode - sync data for offline use
      await syncDataForOffline();
      toast({
        title: "Field Mode Enabled",
        description: "Data cached for offline use. You can now work without internet.",
      });
    } else if (!newValue) {
      toast({
        title: "Field Mode Disabled",
        description: "Returning to online-only mode.",
      });
    }
  }, [isFieldModeEnabled, isOnline, toast]);

  // Sync data for offline use
  const syncDataForOffline = useCallback(async () => {
    if (!userId) return;

    setIsSyncing(true);
    try {
      // Fetch resource bundles
      const { data: bundlesData } = await supabase
        .from("resource_bundles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      // Fetch organization programs (if user is in an org)
      const { data: memberData } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();

      let programsData: OrganizationProgram[] = [];
      let eventsData: OrganizationEvent[] = [];

      if (memberData?.organization_id) {
        const { data: programs } = await supabase
          .from("organization_programs")
          .select("*")
          .eq("organization_id", memberData.organization_id)
          .eq("is_active", true);
        programsData = programs || [];

        const { data: events } = await supabase
          .from("organization_events")
          .select("*")
          .eq("organization_id", memberData.organization_id)
          .gte("start_time", new Date().toISOString());
        eventsData = events || [];
      }

      // Save to IndexedDB
      const timestamp = Date.now();

      await offlineStorage.saveItem("fieldModeBundles", {
        id: "bundles",
        type: "bundles",
        data: bundlesData || [],
        timestamp,
      });

      await offlineStorage.saveItem("fieldModePrograms", {
        id: "programs",
        type: "programs",
        data: programsData,
        timestamp,
      });

      await offlineStorage.saveItem("fieldModeEvents", {
        id: "events",
        type: "events",
        data: eventsData,
        timestamp,
      });

      setCachedData({
        bundles: bundlesData || [],
        workflows: [],
        programs: programsData,
        events: eventsData,
        lastSynced: timestamp,
      });

      setLastSynced(new Date(timestamp));

    } catch (error) {
      console.error("Error syncing for offline:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not cache data for offline use.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [userId, toast]);

  // Load cached data from IndexedDB
  const loadCachedData = useCallback(async () => {
    try {
      const bundles = await offlineStorage.getItem<ResourceBundle[]>("fieldModeBundles", "bundles");
      const programs = await offlineStorage.getItem<OrganizationProgram[]>("fieldModePrograms", "programs");
      const events = await offlineStorage.getItem<OrganizationEvent[]>("fieldModeEvents", "events");

      setCachedData({
        bundles: bundles?.data || [],
        workflows: [],
        programs: programs?.data || [],
        events: events?.data || [],
        lastSynced: bundles?.timestamp || null,
      });

      if (bundles?.timestamp) {
        setLastSynced(new Date(bundles.timestamp));
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  }, []);

  // Add item to sync queue (for offline changes)
  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${item.table}-${Date.now()}`,
      timestamp: Date.now(),
    };
    setSyncQueue(prev => [...prev, queueItem]);

    // Also save to IndexedDB for persistence
    offlineStorage.saveItem("syncQueue", {
      id: queueItem.id,
      type: "syncQueue",
      data: queueItem,
      timestamp: queueItem.timestamp,
    });
  }, []);

  // Sync pending changes when back online
  const syncPendingChanges = useCallback(async () => {
    if (syncQueue.length === 0) return;

    setIsSyncing(true);
    try {
      for (const item of syncQueue) {
        switch (item.type) {
          case 'create':
            await supabase.from(item.table).insert(item.data);
            break;
          case 'update':
            await supabase.from(item.table).update(item.data).eq('id', item.data.id);
            break;
          case 'delete':
            await supabase.from(item.table).delete().eq('id', item.data.id);
            break;
        }
      }

      setSyncQueue([]);
      await offlineStorage.clearStore("syncQueue");

      toast({
        title: "Sync Complete",
        description: "All offline changes have been synced.",
      });

      // Refresh cached data
      await syncDataForOffline();
    } catch (error) {
      console.error("Error syncing pending changes:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Some changes could not be synced. Will retry when online.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, toast, syncDataForOffline]);

  // Load cached data on mount if field mode is enabled
  useEffect(() => {
    if (isFieldModeEnabled) {
      loadCachedData();
    }
  }, [isFieldModeEnabled, loadCachedData]);

  // Force sync function
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Cannot Sync",
        description: "You are currently offline.",
      });
      return;
    }

    await syncDataForOffline();
    toast({
      title: "Data Refreshed",
      description: "Offline cache updated with latest data.",
    });
  }, [isOnline, syncDataForOffline, toast]);

  return {
    isFieldModeEnabled,
    isOnline,
    isSyncing,
    lastSynced,
    cachedData,
    hasPendingChanges: syncQueue.length > 0,
    toggleFieldMode,
    forceSync,
    addToSyncQueue,
  };
}
