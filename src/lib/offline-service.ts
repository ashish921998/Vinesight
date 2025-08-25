import { DatabaseService, Farm } from './db-utils';

export interface OfflineAction {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;
  data: any;
  localId?: string;
  serverId?: string;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

export interface OfflineStorageConfig {
  maxRetries: number;
  syncInterval: number; // milliseconds
  batchSize: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  connectionType: string;
  effectiveType: string;
}

export class OfflineService {
  private static config: OfflineStorageConfig = {
    maxRetries: 3,
    syncInterval: 30000, // 30 seconds
    batchSize: 50
  };

  private static syncIntervalId: NodeJS.Timeout | null = null;
  private static networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  };

  // Initialize offline service
  static async init() {
    this.setupNetworkListeners();
    this.startSyncProcess();
    
    // Initialize seed data first, then preload
    const { initializeSeedData } = await import('./db-utils');
    await initializeSeedData();
    
    this.preloadCriticalData();
    console.log('Offline service initialized');
  }

  // Setup network event listeners
  private static setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
      this.networkStatus.lastOnline = new Date();
      this.triggerSync();
      console.log('Network: Back online, starting sync');
    });

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
      console.log('Network: Gone offline, queuing operations');
    });

    // Check network connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkStatus.connectionType = connection.type || 'unknown';
      this.networkStatus.effectiveType = connection.effectiveType || 'unknown';
      
      connection.addEventListener('change', () => {
        this.networkStatus.connectionType = connection.type || 'unknown';
        this.networkStatus.effectiveType = connection.effectiveType || 'unknown';
      });
    }
  }

  // Preload critical data for offline access
  private static async preloadCriticalData() {
    try {
      // Preload farms data
      const farms = await DatabaseService.getAllFarms();
      console.log(`Preloaded ${farms.length} farms for offline access`);

      // Preload recent records for each farm
      for (const farm of farms.slice(0, 5)) { // Limit to 5 most recent farms
        try {
          await DatabaseService.getIrrigationRecords(farm.id!);
          await DatabaseService.getSprayRecords(farm.id!);
          await DatabaseService.getHarvestRecords(farm.id!);
          await DatabaseService.getFertigationRecords(farm.id!);
        } catch (error) {
          console.warn(`Failed to preload data for farm ${farm.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  // Start automatic sync process
  private static startSyncProcess() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      if (this.networkStatus.isOnline) {
        this.syncPendingActions();
      }
    }, this.config.syncInterval);
  }

  // Stop sync process
  static stopSyncProcess() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // Get current network status
  static getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  // Queue an action for offline sync
  static async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        ...action,
        timestamp: new Date(),
        synced: false,
        retryCount: 0
      };

      // Store in IndexedDB offline queue
      await this.storeOfflineAction(offlineAction);
      
      console.log('Action queued for offline sync:', offlineAction.type, offlineAction.tableName);
      
      // Try immediate sync if online
      if (this.networkStatus.isOnline) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Failed to queue offline action:', error);
      throw error;
    }
  }

  // Store offline action in IndexedDB
  private static async storeOfflineAction(action: OfflineAction): Promise<void> {
    try {
      // Use the existing DatabaseService to store offline actions
      // We'll extend the database schema to include an offline_actions table
      const db = await DatabaseService.getDatabase();
      
      if (!db.offline_actions) {
        // Add offline_actions table if it doesn't exist
        db.version(db.verno + 1).stores({
          ...Object.fromEntries(
            Object.entries(db._dbSchema).map(([name, schema]) => [name, schema.primKey.keyPath])
          ),
          offline_actions: '++id,type,tableName,timestamp,synced'
        });
      }

      await db.offline_actions.add(action);
    } catch (error) {
      console.error('Failed to store offline action:', error);
      throw error;
    }
  }

  // Retrieve pending offline actions
  private static async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const db = await DatabaseService.getDatabase();
      if (!db.offline_actions) return [];
      
      // Get all records and filter manually since boolean queries can be problematic
      const allActions = await db.offline_actions.toArray();
      return allActions
        .filter(action => !action.synced && action.retryCount < this.config.maxRetries)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Failed to retrieve pending actions:', error);
      return [];
    }
  }

  // Trigger immediate sync
  static async triggerSync(): Promise<void> {
    if (!this.networkStatus.isOnline) {
      console.log('Cannot sync: offline');
      return;
    }

    try {
      await this.syncPendingActions();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Sync pending actions
  private static async syncPendingActions(): Promise<void> {
    const pendingActions = await this.getPendingActions();
    if (pendingActions.length === 0) return;

    console.log(`Syncing ${pendingActions.length} pending actions`);
    
    const batch = pendingActions.slice(0, this.config.batchSize);
    const syncPromises = batch.map(action => this.syncSingleAction(action));
    
    await Promise.allSettled(syncPromises);
  }

  // Sync a single action
  private static async syncSingleAction(action: OfflineAction): Promise<void> {
    try {
      // Since we're using local IndexedDB, we'll simulate server sync
      // In a real implementation, this would send data to your backend API
      
      // For now, we'll just mark as synced after a short delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mark action as synced
      await this.markActionSynced(action.id!);
      
      console.log('Action synced:', action.type, action.tableName);
    } catch (error) {
      console.error('Failed to sync action:', error);
      await this.incrementRetryCount(action.id!);
    }
  }

  // Mark action as synced
  private static async markActionSynced(actionId: number): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      if (db.offline_actions) {
        await db.offline_actions.update(actionId, { synced: true });
      }
    } catch (error) {
      console.error('Failed to mark action as synced:', error);
    }
  }

  // Increment retry count for failed sync
  private static async incrementRetryCount(actionId: number): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      if (db.offline_actions) {
        const action = await db.offline_actions.get(actionId);
        if (action) {
          await db.offline_actions.update(actionId, { 
            retryCount: action.retryCount + 1 
          });
        }
      }
    } catch (error) {
      console.error('Failed to increment retry count:', error);
    }
  }

  // Get offline storage statistics
  static async getOfflineStats(): Promise<{
    totalActions: number;
    pendingActions: number;
    failedActions: number;
    storageUsed: number;
    lastSync: Date | null;
  }> {
    try {
      const db = await DatabaseService.getDatabase();
      if (!db.offline_actions) {
        return {
          totalActions: 0,
          pendingActions: 0,
          failedActions: 0,
          storageUsed: 0,
          lastSync: null
        };
      }

      // Ensure the table exists and is properly initialized
      try {
        await db.offline_actions.limit(1).toArray();
      } catch (error) {
        console.warn('offline_actions table not properly initialized:', error);
        return {
          totalActions: 0,
          pendingActions: 0,
          failedActions: 0,
          storageUsed: 0,
          lastSync: null
        };
      }

      let totalActions = 0;
      let pendingActions = 0;
      let failedActions = 0;

      try {
        totalActions = await db.offline_actions.count();
        // Manual filtering for boolean values
        const allActions = await db.offline_actions.toArray();
        pendingActions = allActions.filter(action => !action.synced).length;
        failedActions = allActions.filter(action => action.retryCount >= this.config.maxRetries).length;
      } catch (error) {
        console.warn('Error querying offline actions, table might be empty or schema mismatch:', error);
        // Return default values if there's a schema issue
        totalActions = 0;
        pendingActions = 0;
        failedActions = 0;
      }

      // Estimate storage usage
      const storageUsed = await this.estimateStorageUsage();
      
      // Get last successful sync
      let lastSync: Date | null = null;
      try {
        // Manual filtering for boolean values
        const allActions = await db.offline_actions.toArray();
        const syncedActions = allActions
          .filter(action => action.synced)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        lastSync = syncedActions.length > 0 ? syncedActions[0].timestamp : null;
      } catch (error) {
        console.warn('Error querying last sync time:', error);
        lastSync = null;
      }

      return {
        totalActions,
        pendingActions,
        failedActions,
        storageUsed,
        lastSync
      };
    } catch (error) {
      console.error('Failed to get offline stats:', error);
      return {
        totalActions: 0,
        pendingActions: 0,
        failedActions: 0,
        storageUsed: 0,
        lastSync: null
      };
    }
  }

  // Estimate storage usage in bytes
  private static async estimateStorageUsage(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to estimate storage usage:', error);
      return 0;
    }
  }

  // Clear synced offline actions (cleanup)
  static async clearSyncedActions(): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      if (db.offline_actions) {
        // Get synced actions and delete them manually
        const allActions = await db.offline_actions.toArray();
        const syncedActionIds = allActions
          .filter(action => action.synced)
          .map(action => action.id)
          .filter(id => id !== undefined) as number[];
        
        if (syncedActionIds.length > 0) {
          await db.offline_actions.bulkDelete(syncedActionIds);
          console.log(`Cleared ${syncedActionIds.length} synced offline actions`);
        }
      }
    } catch (error) {
      console.error('Failed to clear synced actions:', error);
    }
  }

  // Force retry failed actions
  static async retryFailedActions(): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      if (db.offline_actions) {
        // Manual filtering for retry count queries
        const allActions = await db.offline_actions.toArray();
        const failedActionIds = allActions
          .filter(action => action.retryCount >= this.config.maxRetries)
          .map(action => action.id)
          .filter(id => id !== undefined) as number[];
        
        if (failedActionIds.length > 0) {
          // Reset retry count for failed actions
          for (const id of failedActionIds) {
            await db.offline_actions.update(id, { retryCount: 0 });
          }
          console.log(`Reset ${failedActionIds.length} failed actions for retry`);
        }
        
        if (this.networkStatus.isOnline) {
          this.triggerSync();
        }
      }
    } catch (error) {
      console.error('Failed to retry failed actions:', error);
    }
  }

  // Export offline data for manual backup
  static async exportOfflineData(): Promise<{
    farms: any[];
    irrigationRecords: any[];
    sprayRecords: any[];
    harvestRecords: any[];
    fertigationRecords: any[];
    expenseRecords: any[];
    offlineActions: OfflineAction[];
    exportTimestamp: Date;
  }> {
    try {
      const farms = await DatabaseService.getAllFarms();
      const db = await DatabaseService.getDatabase();
      
      // Get all records for all farms
      const irrigationRecords = [];
      const sprayRecords = [];
      const harvestRecords = [];
      const fertigationRecords = [];
      const expenseRecords = [];

      for (const farm of farms) {
        if (farm.id) {
          irrigationRecords.push(...await DatabaseService.getIrrigationRecords(farm.id));
          sprayRecords.push(...await DatabaseService.getSprayRecords(farm.id));
          harvestRecords.push(...await DatabaseService.getHarvestRecords(farm.id));
          fertigationRecords.push(...await DatabaseService.getFertigationRecords(farm.id));
          expenseRecords.push(...await DatabaseService.getExpenseRecords(farm.id));
        }
      }

      // Get offline actions
      const offlineActions = db.offline_actions ? 
        await db.offline_actions.toArray() : [];

      return {
        farms,
        irrigationRecords,
        sprayRecords,
        harvestRecords,
        fertigationRecords,
        expenseRecords,
        offlineActions,
        exportTimestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to export offline data:', error);
      throw error;
    }
  }
}

// Enhanced DatabaseService wrapper for offline operations
export class OfflineDBService {
  // Wrapper for add operations with offline queuing
  static async addWithOfflineSupport<T>(
    tableName: string,
    data: T,
    addFunction: () => Promise<any>
  ): Promise<any> {
    try {
      if (OfflineService.getNetworkStatus().isOnline) {
        // Online: execute immediately
        const result = await addFunction();
        return result;
      } else {
        // Offline: execute locally and queue for sync
        const result = await addFunction();
        
        await OfflineService.queueAction({
          type: 'CREATE',
          tableName,
          data,
          localId: result?.toString()
        });

        return result;
      }
    } catch (error) {
      // If online operation fails, fall back to offline
      const result = await addFunction();
      
      await OfflineService.queueAction({
        type: 'CREATE',
        tableName,
        data,
        localId: result?.toString()
      });

      return result;
    }
  }

  // Wrapper for update operations with offline queuing
  static async updateWithOfflineSupport<T>(
    tableName: string,
    id: any,
    data: T,
    updateFunction: () => Promise<any>
  ): Promise<any> {
    try {
      const result = await updateFunction();
      
      // Queue for sync regardless of online status
      await OfflineService.queueAction({
        type: 'UPDATE',
        tableName,
        data: { id, ...data },
        localId: id?.toString()
      });

      return result;
    } catch (error) {
      console.error('Update operation failed:', error);
      throw error;
    }
  }

  // Wrapper for delete operations with offline queuing
  static async deleteWithOfflineSupport(
    tableName: string,
    id: any,
    deleteFunction: () => Promise<any>
  ): Promise<any> {
    try {
      const result = await deleteFunction();
      
      // Queue for sync
      await OfflineService.queueAction({
        type: 'DELETE',
        tableName,
        data: { id },
        localId: id?.toString()
      });

      return result;
    } catch (error) {
      console.error('Delete operation failed:', error);
      throw error;
    }
  }
}