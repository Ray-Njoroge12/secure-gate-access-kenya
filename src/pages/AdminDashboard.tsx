import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [residents, setResidents] = useState([]);
  const [guards, setGuards] = useState([]);
  const [newResidentEmail, setNewResidentEmail] = useState("");
  const [newResidentPassword, setNewResidentPassword] = useState("");
  const [newGuardEmail, setNewGuardEmail] = useState("");
  const [newGuardPassword, setNewGuardPassword] = useState("");
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from("system_settings").select("setting_name, setting_value");
    if (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Error", description: "Failed to fetch system settings", variant: "destructive" });
    } else {
      const fetchedSettings: { [key: string]: any } = {};
      data.forEach((s: any) => {
        fetchedSettings[s.setting_name] = s.setting_value;
      });
      setSettings(fetchedSettings);
    }
  };

  const handleSettingChange = (name: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      for (const settingName in settings) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(
            { setting_name: settingName, setting_value: settings[settingName] },
            { onConflict: "setting_name" }
          );
        if (error) throw error;
      }
      toast({ title: "Success", description: "System settings saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      console.error("Error saving settings:", error);
    }
  };

  const fetchUsers = async () => {
    // Fetch residents (example: assuming residents are users with a specific role or metadata)
    const { data: residentData, error: residentError } = await supabase
      .from("profiles") // Assuming a profiles table linked to auth.users
      .select("id, email, role, auth_users(banned_until)")
      .eq("role", "resident");

    if (residentError) {
      toast({ title: "Error", description: "Failed to fetch residents", variant: "destructive" });
      console.error("Error fetching residents:", residentError);
    } else {
      setResidents(residentData);
    }

    // Fetch guards (example: assuming guards are users with a specific role or from a guards table)
    const { data: guardData, error: guardError } = await supabase
      .from("guards") // Assuming a dedicated guards table
      .select("id, email, auth_users(banned_until)");

    if (guardError) {
      toast({ title: "Error", description: "Failed to fetch guards", variant: "destructive" });
      console.error("Error fetching guards:", guardError);
    } else {
      setGuards(guardData);
    }
  };

  const handleAddResident = async () => {
    if (!newResidentEmail || !newResidentPassword) {
      toast({ title: "Error", description: "Email and password are required for new resident.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("add-resident", {
        body: { email: newResidentEmail, password: newResidentPassword, role: "resident" },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Resident added successfully." });
      setNewResidentEmail("");
      setNewResidentPassword("");
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      console.error("Error adding resident:", error);
    }
  };

  const handleAddGuard = async () => {
    if (!newGuardEmail || !newGuardPassword) {
      toast({ title: "Error", description: "Email and password are required for new guard.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("add-guard", {
        body: { email: newGuardEmail, password: newGuardPassword, role: "guard" },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Guard added successfully." });
      setNewGuardEmail("");
      setNewGuardPassword("");
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      console.error("Error adding guard:", error);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke("update-user-status", {
        body: { userId, active: !currentStatus },
      });

      if (error) throw error;

      toast({ title: "Success", description: `User status updated to ${!currentStatus ? 'active' : 'inactive'}.` });
      fetchUsers(); // Re-fetch users to update the list
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      console.error("Error toggling user status:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resident Management */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="New resident email"
                value={newResidentEmail}
                onChange={(e) => setNewResidentEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={newResidentPassword}
                onChange={(e) => setNewResidentPassword(e.target.value)}
              />
              <Button onClick={handleAddResident}>Add Resident</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident: any) => (
                  <TableRow key={resident.id}>
                    <TableCell>{resident.id}</TableCell>
                    <TableCell>{resident.email}</TableCell>
                    <TableCell>{resident.role}</TableCell>
                    <TableCell>{resident.auth_users[0]?.banned_until ? 'Inactive' : 'Active'}</TableCell>
                    <TableCell>
                      <Button
                        variant={resident.auth_users[0]?.banned_until ? 'default' : 'destructive'}
                        size="sm"
                        onClick={() => handleToggleUserStatus(resident.id, !resident.auth_users[0]?.banned_until)}
                      >
                        {resident.auth_users[0]?.banned_until ? 'Activate' : 'Deactivate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleResetPassword(resident.id)}
                      >
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Guard Management */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Security Guards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="New guard email"
                value={newGuardEmail}
                onChange={(e) => setNewGuardEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={newGuardPassword}
                onChange={(e) => setNewGuardPassword(e.target.value)}
              />
              <Button onClick={handleAddGuard}>Add Guard</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guards.map((guard: any) => (
                  <TableRow key={guard.id}>
                    <TableCell>{guard.id}</TableCell>
                    <TableCell>{guard.email}</TableCell>
                    <TableCell>{guard.auth_users[0]?.banned_until ? 'Inactive' : 'Active'}</TableCell>
                    <TableCell>
                      <Button
                        variant={guard.auth_users[0]?.banned_until ? 'default' : 'destructive'}
                        size="sm"
                        onClick={() => handleToggleUserStatus(guard.id, !guard.auth_users[0]?.banned_until)}
                      >
                        {guard.auth_users[0]?.banned_until ? 'Activate' : 'Deactivate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleResetPassword(guard.id)}
                      >
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* System Settings */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invitation-expiry">Invitation Expiry (Days)</Label>
                <Input
                  id="invitation-expiry"
                  type="number"
                  value={settings.invitation_expiry_days || ''}
                  onChange={(e) => handleSettingChange('invitation_expiry_days', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="pii-retention">PII Retention (Days)</Label>
                <Input
                  id="pii-retention"
                  type="number"
                  value={settings.pii_retention_days || ''}
                  onChange={(e) => handleSettingChange('pii_retention_days', parseInt(e.target.value))}
                />
              </div>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
              <Button onClick={handleCleanOldInvitations} className="ml-2">Clean Old Invitations</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
