import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/integrations/supabase/client';

export interface AuthUser { id: string; email: string; role?: string }
// Include access_token so components that need to call secured functions can pass it
export interface AuthSession { user: AuthUser | null; access_token?: string }

// Centralized auth session hook to avoid repeating API calls.
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await apiClient.getSession();
    if (response.data) {
      const apiSession = response.data;
      setSession({
        user: apiSession.user ? {
          id: apiSession.user.id,
          email: apiSession.user.email,
          role: undefined // Role will be handled separately through profiles/memberships
        } : null,
        access_token: apiSession.access_token
      });
    } else {
      setSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // For now, we'll use a simple polling mechanism since we don't have real-time auth state changes
    // In a production environment, you might want to implement WebSocket or long-polling for auth state
    const interval = setInterval(refresh, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refresh]);

  const getAccessToken = () => session?.access_token || null;
  return { session, loading, refresh, getAccessToken };
}
