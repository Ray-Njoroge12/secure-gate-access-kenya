import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useTenant } from "@/context/TenantProvider";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const { activeCommunityId, memberships, loading: tenantLoading } = useTenant();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const resolveRole = async () => {
      if (!session?.user) return;
      setRoleLoading(true);

      // Try to derive role from active membership (tenant-aware)
      const membership = memberships.find(m => m.community_id === activeCommunityId);
      if (membership?.role) {
        setUserRole(membership.role);
        setRoleLoading(false);
        return;
      }

      // Fallback to legacy profiles.role if no membership found
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setUserRole(data?.role ?? null);
      setRoleLoading(false);
    };

    resolveRole();
  }, [session, memberships, activeCommunityId]);

  if (loading || roleLoading || tenantLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}