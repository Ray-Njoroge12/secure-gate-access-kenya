import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMemberships([]);
        setActiveCommunityId(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_communities')
        .select(
          `community_id, role, is_active, communities:community_id ( name )`
        )
        .eq('user_id', user.id);

      if (error) throw error;

      const mapped: TenantMembership[] = (data || []).map((row: any) => ({
        community_id: row.community_id,
        role: row.role,
        is_active: row.is_active,
        community_name: row.communities?.name ?? null,
      }));

      setMemberships(mapped);

      const active = mapped.find(m => m.is_active) || mapped[0];
      setActiveCommunityId(active ? active.community_id : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();

    const { data: sub } = supabase.auth.onAuthStateChange((_event) => {
      // Reload memberships when user logs in/out
      loadMemberships();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadMemberships]);

  const setActiveCommunity = useCallback(async (communityId: string) => {
    // Use RPC for safe switching; fallback to direct update if needed
    const { error } = await supabase.rpc('set_active_community', { p_community_id: communityId });
    if (error) throw error;
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
