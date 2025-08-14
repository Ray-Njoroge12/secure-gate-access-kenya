import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfflineAccessCode {
  qr_token: string;
  pin_hash: string;
  expires_at: string;
  visitor_id: string;
  resident_id: string;
}

interface OfflineVerificationResult {
  success: boolean;
  visitor_name?: string;
  resident_id?: string;
  expires_at?: string;
  message: string;
}

interface OfflineCacheState {
  isOnline: boolean;
  cacheSize: number;
  lastSync: Date | null;
  pendingSync: number;
}

const CACHE_KEY = 'secure_gate_offline_cache';
const PENDING_SYNC_KEY = 'secure_gate_pending_sync';

export function useOfflineAccessCache() {
  const { toast } = useToast();
  const [state, setState] = useState<OfflineCacheState>({
    isOnline: navigator.onLine,
    cacheSize: 0,
    lastSync: null,
    pendingSync: 0
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      syncOfflineUsage();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "Offline Mode",
        description: "Using cached access codes for verification",
        variant: "default"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Populate offline cache with recent access codes
  const populateCache = useCallback(async () => {
    try {
      const { data: accessCodes, error } = await supabase
        .from('access_codes')
        .select('qr_token, pin_hash, expires_at, visitor_id, resident_id')
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .limit(100);

      if (error) throw error;

      const cacheData = {
        codes: accessCodes || [],
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      const cachedCount = accessCodes?.length || 0;
      
      setState(prev => ({ 
        ...prev, 
        cacheSize: cachedCount,
        lastSync: new Date()
      }));

      if (cachedCount > 0) {
        toast({
          title: "Cache Updated",
          description: `${cachedCount} access codes cached for offline use`,
        });
      }

      return cachedCount;
    } catch (error) {
      console.error('Failed to populate offline cache:', error);
      toast({
        title: "Cache Error",
        description: "Failed to update offline cache",
        variant: "destructive"
      });
      return 0;
    }
  }, [toast]);

  // Verify access code (online or offline)
  const verifyAccess = useCallback(async (
    accessCode: string, 
    guardId?: string,
    method: 'qr' | 'pin' = 'qr'
  ): Promise<OfflineVerificationResult> => {
    try {
      if (state.isOnline) {
        // Try online verification first
        const searchField = method === 'qr' ? 'qr_token' : 'pin_hash';
        const { data, error } = await supabase
          .from('access_codes')
          .select('*, visit_invitations!inner(*)')
          .eq(searchField, accessCode)
          .single();

        if (!error && data && new Date(data.expires_at) > new Date() && !data.used_at) {
          // Mark as used
          await supabase
            .from('access_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', data.id);

          // Log to audit logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: guardId,
              event_type: 'access_granted',
              entity_type: 'access_code',
              entity_id: data.id,
              details: {
                method: 'online',
                verification_method: method,
                visitor_id: data.visitor_id
              }
            });

          return {
            success: true,
            visitor_name: 'Visitor',
            resident_id: data.resident_id,
            expires_at: data.expires_at,
            message: 'Access granted (online verification)'
          };
        }
      }

      // Fall back to offline verification
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) {
        return {
          success: false,
          message: 'No offline cache available'
        };
      }

      const cache = JSON.parse(cacheData);
      const searchField = method === 'qr' ? 'qr_token' : 'pin_hash';
      const cachedCode = cache.codes.find((code: OfflineAccessCode) => 
        code[searchField] === accessCode && 
        new Date(code.expires_at) > new Date()
      );

      if (!cachedCode) {
        return {
          success: false,
          message: 'Access code not found or expired'
        };
      }

      // Store pending sync
      const pendingData = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
      pendingData.push({
        access_code: accessCode,
        method: method,
        guard_id: guardId,
        timestamp: new Date().toISOString(),
        visitor_id: cachedCode.visitor_id,
        resident_id: cachedCode.resident_id
      });
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingData));

      setState(prev => ({ ...prev, pendingSync: pendingData.length }));

      toast({
        title: state.isOnline ? "Access Granted" : "Access Granted (Offline)",
        description: "Visitor access verified",
        variant: "default"
      });

      return {
        success: true,
        visitor_name: 'Visitor',
        resident_id: cachedCode.resident_id,
        expires_at: cachedCode.expires_at,
        message: 'Access granted (offline verification)'
      };

    } catch (error) {
      console.error('Access verification failed:', error);
      return {
        success: false,
        message: 'Verification failed - please try again'
      };
    }
  }, [state.isOnline, toast]);

  // Sync offline usage when network is restored
  const syncOfflineUsage = useCallback(async () => {
    if (!state.isOnline) return 0;

    try {
      const pendingData = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
      if (pendingData.length === 0) return 0;

      let syncedCount = 0;

      for (const pending of pendingData) {
        try {
          // Log to audit logs
          await supabase
            .from('audit_logs')
            .insert({
              user_id: pending.guard_id,
              event_type: 'access_granted',
              entity_type: 'access_code',
              details: {
                method: 'offline_sync',
                verification_method: pending.method,
                visitor_id: pending.visitor_id,
                offline_timestamp: pending.timestamp
              }
            });

          syncedCount++;
        } catch (error) {
          console.error('Failed to sync pending access:', error);
        }
      }

      // Clear synced data
      localStorage.setItem(PENDING_SYNC_KEY, '[]');
      
      setState(prev => ({ 
        ...prev, 
        pendingSync: 0,
        lastSync: new Date()
      }));

      if (syncedCount > 0) {
        toast({
          title: "Data Synced",
          description: `${syncedCount} offline verifications synced`,
        });
      }

      return syncedCount;
    } catch (error) {
      console.error('Failed to sync offline usage:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync offline data",
        variant: "destructive"
      });
      return 0;
    }
  }, [state.isOnline, toast]);

  // Get cache status
  const getCacheStatus = useCallback(async () => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      const pendingData = localStorage.getItem(PENDING_SYNC_KEY);

      const cacheSize = cacheData ? JSON.parse(cacheData).codes.length : 0;
      const pendingSync = pendingData ? JSON.parse(pendingData).length : 0;

      setState(prev => ({ ...prev, cacheSize, pendingSync }));

      return { cacheSize, pendingSync };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return { cacheSize: 0, pendingSync: 0 };
    }
  }, []);

  // Initialize cache status
  useEffect(() => {
    getCacheStatus();
  }, [getCacheStatus]);

  // Auto-populate cache periodically when online
  useEffect(() => {
    if (!state.isOnline) return;

    const interval = setInterval(() => {
      populateCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Initial population
    populateCache();

    return () => clearInterval(interval);
  }, [state.isOnline, populateCache]);

  return {
    state,
    populateCache,
    verifyAccess,
    syncOfflineUsage,
    getCacheStatus
  };
}
