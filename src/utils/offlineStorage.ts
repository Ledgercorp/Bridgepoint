// Offline storage utilities using IndexedDB
const DB_NAME = "BridgePointOffline";
const DB_VERSION = 2; // Incremented for Field Mode stores

interface OfflineItem<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different types of data
        if (!db.objectStoreNames.contains("savedSteps")) {
          db.createObjectStore("savedSteps", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("resources")) {
          const resourceStore = db.createObjectStore("resources", { keyPath: "id" });
          resourceStore.createIndex("timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("documents")) {
          db.createObjectStore("documents", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("miniLessons")) {
          db.createObjectStore("miniLessons", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("quickTasks")) {
          db.createObjectStore("quickTasks", { keyPath: "key" });
        }

        // Field Mode stores
        if (!db.objectStoreNames.contains("fieldModeBundles")) {
          db.createObjectStore("fieldModeBundles", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("fieldModeWorkflows")) {
          db.createObjectStore("fieldModeWorkflows", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("fieldModePrograms")) {
          db.createObjectStore("fieldModePrograms", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("fieldModeEvents")) {
          db.createObjectStore("fieldModeEvents", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
          syncStore.createIndex("timestamp", "timestamp");
        }
      };
    });
  }

  async saveItem<T>(storeName: string, item: OfflineItem<T>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem<T = unknown>(storeName: string, id: string): Promise<OfflineItem<T> | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllItems<T = unknown>(storeName: string): Promise<OfflineItem<T>[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteItem(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Helper to check if we're offline
  isOffline(): boolean {
    return !navigator.onLine;
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize on module load
offlineStorage.init().catch(console.error);
