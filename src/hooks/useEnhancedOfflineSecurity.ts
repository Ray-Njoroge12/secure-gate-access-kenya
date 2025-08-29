import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface OfflineIncident {
  id: string;
  type: 'security' | 'access_denied' | 'suspicious_activity' | 'equipment_failure' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  timestamp: string;
  reportedBy: string;
  evidence?: {
    photos: string[];
    videos: string[];
    audio: string[];
  };
  witnesses?: string[];
  actions_taken?: string;
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
}

interface OfflineAccessLog {
  id: string;
  access_code: string;
  verification_result: 'granted' | 'denied';
  visitor_name?: string;
  timestamp: string;
  location: string;
  verification_method: 'pin' | 'qr' | 'manual';
  guard_id: string;
  notes?: string;
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
}

interface SyncQueueItem {
  id: string;
  type: 'incident' | 'access_log' | 'system_event';
  data: any;
  timestamp: string;
  priority: number;
  retry_count: number;
  last_retry?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

interface OfflineSecurityState {
  isOnline: boolean;
  lastSync: string | null;
  syncQueue: SyncQueueItem[];
  incidents: OfflineIncident[];
  accessLogs: OfflineAccessLog[];
  totalPendingItems: number;
  syncInProgress: boolean;
  storageUsage: number;
  maxStorage: number;
}

export function useEnhancedOfflineSecurity() {
  const { toast } = useToast();
  const [state, setState] = useState<OfflineSecurityState>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncQueue: [],
    incidents: [],
    accessLogs: [],
    totalPendingItems: 0,
    syncInProgress: false,
    storageUsage: 0,
    maxStorage: 50 * 1024 * 1024 // 50MB
  });

  // Initialize offline storage
  const initializeOfflineStorage = useCallback(async () => {
    try {
      // Load existing data from localStorage
      const storedIncidents = localStorage.getItem('offline_incidents');
      const storedAccessLogs = localStorage.getItem('offline_access_logs');
      const storedSyncQueue = localStorage.getItem('sync_queue');
      const lastSync = localStorage.getItem('last_sync');

      setState(prev => ({
        ...prev,
        incidents: storedIncidents ? JSON.parse(storedIncidents) : [],
        accessLogs: storedAccessLogs ? JSON.parse(storedAccessLogs) : [],
        syncQueue: storedSyncQueue ? JSON.parse(storedSyncQueue) : [],
        lastSync: lastSync || null
      }));

      // Calculate storage usage
      calculateStorageUsage();

    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      toast({
        title: "Storage Error",
        description: "Failed to initialize offline security storage",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Calculate current storage usage
  const calculateStorageUsage = () => {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (key.startsWith('offline_') || key.startsWith('sync_')) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }
      
      setState(prev => ({
        ...prev,
        storageUsage: totalSize * 2, // Rough estimate (UTF-16)
        totalPendingItems: prev.syncQueue.filter(item => item.status === 'pending').length
      }));
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  };

  // Save incident offline
  const saveIncidentOffline = useCallback(async (incident: Omit<OfflineIncident, 'id' | 'status' | 'retry_count'>) => {
    const newIncident: OfflineIncident = {
      ...incident,
      id: `offline_incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retry_count: 0
    };

    try {
      // Add to local state
      setState(prev => {
        const updatedIncidents = [...prev.incidents, newIncident];
        localStorage.setItem('offline_incidents', JSON.stringify(updatedIncidents));
        return { ...prev, incidents: updatedIncidents };
      });

      // Add to sync queue
      await addToSyncQueue({
        type: 'incident',
        data: newIncident,
        priority: incident.severity === 'critical' ? 1 : incident.severity === 'high' ? 2 : 3
      });

      toast({
        title: "Incident Saved",
        description: "Incident saved offline and queued for sync",
      });

      return { success: true, incidentId: newIncident.id };

    } catch (error) {
      console.error('Failed to save incident offline:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save incident offline",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  // Save access log offline
  const saveAccessLogOffline = useCallback(async (accessLog: Omit<OfflineAccessLog, 'id' | 'status' | 'retry_count'>) => {
    const newAccessLog: OfflineAccessLog = {
      ...accessLog,
      id: `offline_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retry_count: 0
    };

    try {
      setState(prev => {
        const updatedLogs = [...prev.accessLogs, newAccessLog];
        localStorage.setItem('offline_access_logs', JSON.stringify(updatedLogs));
        return { ...prev, accessLogs: updatedLogs };
      });

      // Add to sync queue
      await addToSyncQueue({
        type: 'access_log',
        data: newAccessLog,
        priority: 2
      });

      return { success: true, logId: newAccessLog.id };

    } catch (error) {
      console.error('Failed to save access log offline:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retry_count' | 'status'>) => {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      status: 'pending'
    };

    setState(prev => {
      const updatedQueue = [...prev.syncQueue, queueItem].sort((a, b) => a.priority - b.priority);
      localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
      return { ...prev, syncQueue: updatedQueue };
    });

    // Try immediate sync if online
    if (state.isOnline && !state.syncInProgress) {
      setTimeout(() => syncPendingItems(), 1000);
    }
  }, [state.isOnline, state.syncInProgress]);

  // Sync pending items to server
  const syncPendingItems = useCallback(async () => {
    if (!state.isOnline || state.syncInProgress) return;

    setState(prev => ({ ...prev, syncInProgress: true }));

    try {
      const pendingItems = state.syncQueue.filter(item => item.status === 'pending');
      
      for (const item of pendingItems.slice(0, 5)) { // Sync in batches of 5
        try {
          setState(prev => ({
            ...prev,
            syncQueue: prev.syncQueue.map(q => 
              q.id === item.id ? { ...q, status: 'syncing' } : q
            )
          }));

          let syncResult = false;

          if (item.type === 'incident') {
            syncResult = await syncIncident(item.data);
          } else if (item.type === 'access_log') {
            syncResult = await syncAccessLog(item.data);
          }

          if (syncResult) {
            // Mark as synced
            setState(prev => ({
              ...prev,
              syncQueue: prev.syncQueue.map(q => 
                q.id === item.id ? { ...q, status: 'synced' } : q
              )
            }));

            // Remove from local storage after successful sync
            if (item.type === 'incident') {
              setState(prev => ({
                ...prev,
                incidents: prev.incidents.map(inc => 
                  inc.id === item.data.id ? { ...inc, status: 'synced' } : inc
                )
              }));
            }

          } else {
            // Mark as failed and increment retry count
            setState(prev => ({
              ...prev,
              syncQueue: prev.syncQueue.map(q => 
                q.id === item.id ? { 
                  ...q, 
                  status: 'failed', 
                  retry_count: q.retry_count + 1,
                  last_retry: new Date().toISOString()
                } : q
              )
            }));
          }

        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('last_sync', now);
      setState(prev => ({ ...prev, lastSync: now }));

      // Clean up successfully synced items
      cleanupSyncedItems();

    } catch (error) {
      console.error('Sync process failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
      calculateStorageUsage();
    }
  }, [state.isOnline, state.syncInProgress, state.syncQueue, toast]);

  // Sync individual incident
  const syncIncident = async (incident: OfflineIncident): Promise<boolean> => {
    try {
      // TODO: Replace with actual FastAPI endpoint
      // For now, simulate successful sync
      console.log('Syncing incident:', incident);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      return true;
    } catch (error) {
      console.error('Failed to sync incident:', error);
      return false;
    }
  };

  // Sync individual access log
  const syncAccessLog = async (accessLog: OfflineAccessLog): Promise<boolean> => {
    try {
      // TODO: Replace with actual FastAPI endpoint
      // For now, simulate successful sync
      console.log('Syncing access log:', accessLog);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      return true;
    } catch (error) {
      console.error('Failed to sync access log:', error);
      return false;
    }
  };

  // Clean up successfully synced items
  const cleanupSyncedItems = () => {
    setState(prev => {
      const pendingQueue = prev.syncQueue.filter(item => item.status !== 'synced');
      const pendingIncidents = prev.incidents.filter(item => item.status !== 'synced');
      const pendingAccessLogs = prev.accessLogs.filter(item => item.status !== 'synced');

      localStorage.setItem('sync_queue', JSON.stringify(pendingQueue));
      localStorage.setItem('offline_incidents', JSON.stringify(pendingIncidents));
      localStorage.setItem('offline_access_logs', JSON.stringify(pendingAccessLogs));

      return {
        ...prev,
        syncQueue: pendingQueue,
        incidents: pendingIncidents,
        accessLogs: pendingAccessLogs
      };
    });
  };

  // Force retry failed items
  const retryFailedItems = useCallback(async () => {
    setState(prev => ({
      ...prev,
      syncQueue: prev.syncQueue.map(item => 
        item.status === 'failed' ? { ...item, status: 'pending' } : item
      )
    }));

    if (state.isOnline) {
      await syncPendingItems();
    }
  }, [state.isOnline, syncPendingItems]);

  // Clear all offline data (use with caution)
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem('offline_incidents');
    localStorage.removeItem('offline_access_logs');
    localStorage.removeItem('sync_queue');
    localStorage.removeItem('last_sync');
    
    setState(prev => ({
      ...prev,
      incidents: [],
      accessLogs: [],
      syncQueue: [],
      lastSync: null,
      totalPendingItems: 0,
      storageUsage: 0
    }));

    toast({
      title: "Data Cleared",
      description: "All offline security data has been cleared",
    });
  }, [toast]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      syncPendingItems();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingItems]);

  // Initialize on mount
  useEffect(() => {
    initializeOfflineStorage();
  }, [initializeOfflineStorage]);

  // Auto-sync interval when online
  useEffect(() => {
    if (!state.isOnline) return;

    const syncInterval = setInterval(() => {
      if (state.totalPendingItems > 0 && !state.syncInProgress) {
        syncPendingItems();
      }
    }, 60000); // Every minute

    return () => clearInterval(syncInterval);
  }, [state.isOnline, state.totalPendingItems, state.syncInProgress, syncPendingItems]);

  return {
    state,
    saveIncidentOffline,
    saveAccessLogOffline,
    syncPendingItems,
    retryFailedItems,
    clearOfflineData,
    calculateStorageUsage
  };
}
