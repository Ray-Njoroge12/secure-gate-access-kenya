import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTenant } from "@/context/TenantProvider";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, loading } = useAuthSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const { activeCommunityId, memberships, loading: tenantLoading } = useTenant();

  // Session state now provided by useAuthSession

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

      // For now, we'll set a default role since we don't have direct database access
      // In a real implementation, you would make an API call to get the user's role
      setUserRole('resident'); // Default role
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

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
