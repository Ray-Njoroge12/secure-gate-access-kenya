import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { SharedNavigation } from '@/components/SharedNavigation';

interface RolePermissions {
  role: string;
  permissions: string[];
  description: string;
}

interface UserWithRole {
  user_id: string;
  email: string;
  role: string;
  permissions: string[];
  full_name: string | null;
  unit_number: string | null;
  created_at: string;
}

const RoleManagement = () => {
  const { toast } = useToast();
  const { session, loading: authLoading } = useAuthSession();
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Role assignment form
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (!authLoading && session?.user) {
      fetchRoleData();
    }
  }, [authLoading, session]);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      // Fetch role permissions
      const permissionsResult = await apiClient.getRolePermissions();
      if (permissionsResult.error) {
        throw new Error(permissionsResult.error);
      }
      setRolePermissions(permissionsResult.data || []);

      // Fetch users with roles
      const usersResult = await apiClient.listUsersWithRoles();
      if (usersResult.error) {
        throw new Error(usersResult.error);
      }
      setUsers(usersResult.data || []);

      // Get current user's role
      const myRoleResult = await apiClient.getMyRole();
      if (myRoleResult.error) {
        throw new Error(myRoleResult.error);
      }
      setUserProfile(myRoleResult.data);

    } catch (error) {
      console.error('Failed to fetch role data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load role management data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserEmail || !newRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.assignUserRole(selectedUserEmail, newRole);
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: `Role updated successfully for ${selectedUserEmail}`,
      });

      // Refresh the users list
      await fetchRoleData();

      // Clear form
      setSelectedUserEmail('');
      setNewRole('');

    } catch (error) {
      console.error('Failed to assign role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'guard': return 'bg-blue-100 text-blue-800';
      case 'resident': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access role management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation
        userRole={userProfile?.role || 'resident'}
        userName={userProfile?.full_name}
        userEmail={userProfile?.email}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Role Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage user roles and permissions for the secure gate access system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Role Permissions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Role Permissions
              </CardTitle>
              <CardDescription>
                Available roles and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rolePermissions.map((rolePerm) => (
                  <div key={rolePerm.role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize">{rolePerm.role}</h3>
                      <Badge className={getRoleBadgeColor(rolePerm.role)}>
                        {rolePerm.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rolePerm.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {rolePerm.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign Role
              </CardTitle>
              <CardDescription>
                Assign or change a user's role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userEmail">User Email</Label>
                  <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.email}>
                          {user.email} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="newRole">New Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolePermissions.map((rolePerm) => (
                        <SelectItem key={rolePerm.role} value={rolePerm.role}>
                          {rolePerm.role} - {rolePerm.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAssignRole}
                  disabled={loading || !selectedUserEmail || !newRole}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Role'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users and Roles
            </CardTitle>
            <CardDescription>
              Current users and their assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Unit Number</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.unit_number || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagement;
