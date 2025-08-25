import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser { id: string; email: string; role?: string }
// Include access_token so components that need to call secured functions can pass it
export interface AuthSession { user: AuthUser | null; access_token?: string }

// Centralized auth session hook to avoid repeating supabase.auth.getSession calls.
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session as AuthSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Some test environments / stubs may not implement onAuthStateChange
    const authObj: any = (supabase as any).auth;
    if (authObj && typeof authObj.onAuthStateChange === 'function') {
      const { data: listener } = authObj.onAuthStateChange((_event: any, session: any) => {
        setSession(session as AuthSession);
        setLoading(false);
      });
      return () => listener?.subscription?.unsubscribe?.();
    } else {
      // Fallback: mark loading false after initial refresh
      setLoading(false);
    }
  }, [refresh]);

  const getAccessToken = () => session?.access_token || null;
  return { session, loading, refresh, getAccessToken };
}
