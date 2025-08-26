import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';

export type TenantMembership = {
  community_id: string;
  role: 'admin' | 'guard' | 'resident' | string;
  is_active: boolean;
  community_name?: string | null;
};

type TenantContextValue = {
  activeCommunityId: string | null;
  memberships: TenantMembership[];
  loading: boolean;
  setActiveCommunity: (communityId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthSession();

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      if (!session?.user) {
        setMemberships([]);
        setActiveCommunityId(null);
        return;
      }

      // For now, we'll use mock data since we don't have direct database access
      // In a real implementation, you would make an API call to get user memberships
      const mockMemberships: TenantMembership[] = [
        {
          community_id: 'default-community',
          role: 'resident',
          is_active: true,
          community_name: 'Default Community'
        }
      ];

      setMemberships(mockMemberships);
      setActiveCommunityId('default-community');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadMemberships();
    // For now, we'll use a simple polling mechanism
    const interval = setInterval(loadMemberships, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadMemberships]);

  const setActiveCommunity = useCallback(async (communityId: string) => {
    // For now, we'll just set the active community locally
    // In a real implementation, you would make an API call to update the active community
    setActiveCommunityId(communityId);
    await loadMemberships();
  }, [loadMemberships]);

  const value = useMemo(() => ({
    activeCommunityId,
    memberships,
    loading,
    setActiveCommunity,
    refresh: loadMemberships,
  }), [activeCommunityId, memberships, loading, setActiveCommunity, loadMemberships]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
}
