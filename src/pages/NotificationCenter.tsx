import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Bell, 
  Shield, 
  Clock, 
  CheckCircle, 
  X, 
  Send, 
  Phone, 
  Mail, 
  MessageSquare,
  Camera,
  FileText,
  Users,
  Activity
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Notification {
  id: string;
  type: 'visitor_arrival' | 'security_incident' | 'system_alert' | 'emergency';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  relatedId?: string;
  metadata?: any;
}

interface Incident {
  id: string;
  type: 'security_breach' | 'suspicious_activity' | 'emergency' | 'equipment_failure' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  photos?: string[];
  witnesses?: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  visitorArrivals: boolean;
  securityIncidents: boolean;
  systemAlerts: boolean;
  emergencyAlerts: boolean;
  quietHours: { start: string; end: string };
}

const NotificationCenter = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    visitorArrivals: true,
    securityIncidents: true,
    systemAlerts: true,
    emergencyAlerts: true,
    quietHours: { start: '22:00', end: '06:00' }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [unreadCount, setUnreadCount] = useState(0);
  const [newIncident, setNewIncident] = useState({
    type: 'other' as const,
    severity: 'medium' as const,
    title: '',
    description: '',
    location: ''
  });
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);

  useEffect(() => {
    const initializeNotificationCenter = async () => {
      try {
        // Check authentication and role
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Access Denied",
            description: "You need to be logged in to access notifications",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "Access Denied",
            description: "Unable to verify your credentials",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Check if user has appropriate role
        if (!['admin', 'guard', 'resident'].includes(profile.role)) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access notifications",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(profile);
        await loadNotifications();
        await loadIncidents();
        setupRealTimeSubscriptions();

      } catch (error) {
        console.error('Initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize notification center",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeNotificationCenter();
  }, [toast, navigate]);

  const loadNotifications = async () => {
    try {
      // Mock data for demonstration - in production, this would fetch from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'visitor_arrival',
          title: 'Visitor Arrived',
          message: 'John Doe has arrived at the main gate',
          priority: 'medium',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false,
          actionRequired: true,
          relatedId: 'visitor_123'
        },
        {
          id: '2',
          type: 'security_incident',
          title: 'Security Alert',
          message: 'Unauthorized access attempt detected at Gate B',
          priority: 'high',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false,
          actionRequired: true
        },
        {
          id: '3',
          type: 'system_alert',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight at 2 AM',
          priority: 'low',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          read: true
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadIncidents = async () => {
    try {
      // Mock data for demonstration
      const mockIncidents: Incident[] = [
        {
          id: '1',
          type: 'suspicious_activity',
          severity: 'medium',
          title: 'Unusual Vehicle Activity',
          description: 'Multiple vehicles circling the perimeter without entering',
          location: 'Main Gate Area',
          reportedBy: 'Guard John Smith',
          reportedAt: new Date(Date.now() - 30 * 60000).toISOString(),
          status: 'investigating'
        },
        {
          id: '2',
          type: 'equipment_failure',
          severity: 'low',
          title: 'Gate Camera Malfunction',
          description: 'Camera 3 at the east gate is showing intermittent signal',
          location: 'East Gate',
          reportedBy: 'System Monitor',
          reportedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          status: 'open'
        }
      ];

      setIncidents(mockIncidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Set up real-time subscriptions for notifications and incidents
    // In production, this would subscribe to Supabase real-time events
    const interval = setInterval(async () => {
      await loadNotifications();
      await loadIncidents();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const createIncident = async () => {
    if (!newIncident.title || !newIncident.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const incident: Incident = {
      id: Date.now().toString(),
      ...newIncident,
      reportedBy: userProfile?.email || 'Unknown',
      reportedAt: new Date().toISOString(),
      status: 'open'
    };

    setIncidents(prev => [incident, ...prev]);
    setNewIncident({
      type: 'other',
      severity: 'medium',
      title: '',
      description: '',
      location: ''
    });
    setShowNewIncidentForm(false);

    toast({
      title: "Success",
      description: "Incident report created successfully",
    });

    // Create notification for the incident
    const notification: Notification = {
      id: Date.now().toString() + '_notif',
      type: 'security_incident',
      title: `New Incident: ${incident.title}`,
      message: `${incident.severity.toUpperCase()} severity incident reported`,
      priority: incident.severity === 'critical' ? 'critical' : 
                incident.severity === 'high' ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: true,
      relatedId: incident.id
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const updateIncidentStatus = async (incidentId: string, status: Incident['status']) => {
    setIncidents(prev => 
      prev.map(i => 
        i.id === incidentId ? { ...i, status } : i
      )
    );

    toast({
      title: "Success",
      description: `Incident status updated to ${status}`,
    });
  };

  const sendTestNotification = async (type: Notification['type']) => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      type,
      title: `Test ${type.replace('_', ' ')} Notification`,
      message: 'This is a test notification to verify the system is working',
      priority: 'low',
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [testNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    toast({
      title: "Test Notification Sent",
      description: `${type.replace('_', ' ')} notification sent successfully`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading notification center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="mt-2 text-gray-600">
            Real-time notifications and incident management for {userProfile?.email}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <Button onClick={markAllAsRead} variant="outline" disabled={unreadCount === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          
          {userProfile?.role === 'admin' && (
            <>
              <Button onClick={() => sendTestNotification('visitor_arrival')} variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Test Visitor Alert
              </Button>
              <Button onClick={() => sendTestNotification('security_incident')} variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Test Security Alert
              </Button>
            </>
          )}

          <Button 
            onClick={() => setShowNewIncidentForm(true)} 
            className="ml-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full mt-2 ${getPriorityColor(notification.priority)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {notification.type.replace('_', ' ')}
                            </Badge>
                            {notification.priority === 'critical' && (
                              <Badge variant="destructive">CRITICAL</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            {notification.actionRequired && (
                              <Badge variant="secondary">Action Required</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            {/* New Incident Form */}
            {showNewIncidentForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report New Incident
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Incident Type</label>
                      <Select value={newIncident.type} onValueChange={(value: any) => 
                        setNewIncident(prev => ({ ...prev, type: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security_breach">Security Breach</SelectItem>
                          <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Severity</label>
                      <Select value={newIncident.severity} onValueChange={(value: any) => 
                        setNewIncident(prev => ({ ...prev, severity: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      value={newIncident.title}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the incident"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      value={newIncident.location}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Where did this incident occur?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={newIncident.description}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of what happened"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button onClick={createIncident}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Report
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewIncidentForm(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Incidents List */}
            {incidents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No incidents reported</p>
                </CardContent>
              </Card>
            ) : (
              incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                      </div>
                      {(userProfile?.role === 'admin' || userProfile?.role === 'guard') && (
                        <Select 
                          value={incident.status} 
                          onValueChange={(value: any) => updateIncidentStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{incident.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Reported by: {incident.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(incident.reportedAt).toLocaleString()}
                      </span>
                      {incident.location && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          Location: {incident.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Methods</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="rounded"
                      />
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                        className="rounded"
                      />
                      <Phone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="rounded"
                      />
                      <MessageSquare className="h-4 w-4" />
                      <span>Push Notifications</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.visitorArrivals}
                        onChange={(e) => setSettings(prev => ({ ...prev, visitorArrivals: e.target.checked }))}
                        className="rounded"
                      />
                      <Users className="h-4 w-4" />
                      <span>Visitor Arrivals</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.securityIncidents}
                        onChange={(e) => setSettings(prev => ({ ...prev, securityIncidents: e.target.checked }))}
                        className="rounded"
                      />
                      <Shield className="h-4 w-4" />
                      <span>Security Incidents</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.systemAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                        className="rounded"
                      />
                      <Activity className="h-4 w-4" />
                      <span>System Alerts</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.emergencyAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, emergencyAlerts: e.target.checked }))}
                        className="rounded"
                      />
                      <AlertTriangle className="h-4 w-4" />
                      <span>Emergency Alerts</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quiet Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <Input
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <Input
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => {
                  toast({
                    title: "Settings Saved",
                    description: "Your notification preferences have been updated",
                  });
                }}>
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationCenter;
