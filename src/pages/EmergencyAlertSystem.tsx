import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Shield, 
  Siren, 
  Phone, 
  MessageSquare, 
  Clock, 
  Users, 
  MapPin, 
  Mic, 
  Volume2,
  Bell,
  CheckCircle,
  XCircle,
  Play,
  Square,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface EmergencyAlert {
  id: string;
  type: 'fire' | 'medical' | 'security' | 'evacuation' | 'lockdown' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  acknowledgedBy: string[];
  resolvedAt?: string;
  resolvedBy?: string;
  affectedAreas: string[];
  evacuationRequired: boolean;
  estimatedDuration?: string;
  externalAuthorities: {
    police: boolean;
    fire: boolean;
    medical: boolean;
    contacted: boolean;
    contactedAt?: string;
  };
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push' | 'pa_system' | 'siren' | 'mobile_app';
  enabled: boolean;
  priority: number;
  recipients: string[];
  lastUsed?: string;
  status: 'active' | 'inactive' | 'error';
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  priority: number;
  department: string;
  availability: '24/7' | 'business_hours' | 'on_call';
  lastContacted?: string;
}

const EmergencyAlertSystem = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<EmergencyAlert[]>([]);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'maintenance' | 'error'>('operational');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);

  // New alert form state
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'other' as const,
    severity: 'medium' as const,
    title: '',
    message: '',
    location: '',
    affectedAreas: [''],
    evacuationRequired: false,
    estimatedDuration: '',
    contactPolice: false,
    contactFire: false,
    contactMedical: false
  });

  useEffect(() => {
    const initializeEmergencySystem = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Access Denied",
            description: "You need to be logged in to access emergency alerts",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

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

        if (!['admin', 'guard'].includes(profile.role)) {
          toast({
            title: "Access Denied",
            description: "You need admin or security privileges to access emergency system",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setUserProfile(profile);
        await loadEmergencyData();
        setupRealTimeMonitoring();

      } catch (error) {
        console.error('Initialization error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize emergency alert system",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeEmergencySystem();
  }, [toast, navigate]);

  const loadEmergencyData = async () => {
    try {
      // Mock data for demonstration
      const mockActiveAlerts: EmergencyAlert[] = [
        {
          id: '1',
          type: 'security',
          severity: 'high',
          title: 'Security Breach Alert',
          message: 'Unauthorized access detected at East Gate. All security personnel report immediately.',
          location: 'East Gate Entrance',
          isActive: true,
          createdBy: 'Security Admin',
          createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
          acknowledgedBy: ['guard1@company.com', 'supervisor@company.com'],
          affectedAreas: ['East Gate', 'Perimeter Zone B'],
          evacuationRequired: false,
          externalAuthorities: {
            police: true,
            fire: false,
            medical: false,
            contacted: true,
            contactedAt: new Date(Date.now() - 8 * 60000).toISOString()
          }
        }
      ];

      const mockAlertHistory: EmergencyAlert[] = [
        {
          id: '2',
          type: 'fire',
          severity: 'critical',
          title: 'Fire Alarm - Block C',
          message: 'Fire detected in Block C, Level 3. Immediate evacuation required.',
          location: 'Block C, Level 3',
          isActive: false,
          createdBy: 'Fire Safety System',
          createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
          acknowledgedBy: ['admin@company.com', 'guard1@company.com', 'supervisor@company.com'],
          resolvedAt: new Date(Date.now() - 23 * 60 * 60000).toISOString(),
          resolvedBy: 'Fire Chief Johnson',
          affectedAreas: ['Block C', 'Emergency Stairwell C'],
          evacuationRequired: true,
          estimatedDuration: '2 hours',
          externalAuthorities: {
            police: true,
            fire: true,
            medical: true,
            contacted: true,
            contactedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString()
          }
        }
      ];

      const mockNotificationChannels: NotificationChannel[] = [
        {
          id: '1',
          name: 'Emergency SMS',
          type: 'sms',
          enabled: true,
          priority: 1,
          recipients: ['+254700123456', '+254700123457'],
          lastUsed: new Date(Date.now() - 10 * 60000).toISOString(),
          status: 'active'
        },
        {
          id: '2',
          name: 'PA System',
          type: 'pa_system',
          enabled: true,
          priority: 1,
          recipients: ['All Buildings'],
          status: 'active'
        },
        {
          id: '3',
          name: 'Emergency Siren',
          type: 'siren',
          enabled: true,
          priority: 1,
          recipients: ['Campus Wide'],
          status: 'active'
        },
        {
          id: '4',
          name: 'Staff Email Alert',
          type: 'email',
          enabled: true,
          priority: 2,
          recipients: ['staff@company.com', 'security@company.com'],
          status: 'active'
        }
      ];

      const mockEmergencyContacts: EmergencyContact[] = [
        {
          id: '1',
          name: 'Police Emergency',
          role: 'Law Enforcement',
          phone: '999',
          email: 'dispatch@police.gov.ke',
          priority: 1,
          department: 'External',
          availability: '24/7'
        },
        {
          id: '2',
          name: 'Fire Department',
          role: 'Fire & Rescue',
          phone: '999',
          email: 'fire@nairobi.go.ke',
          priority: 1,
          department: 'External',
          availability: '24/7'
        },
        {
          id: '3',
          name: 'Medical Emergency',
          role: 'Medical Services',
          phone: '999',
          email: 'ambulance@redcross.or.ke',
          priority: 1,
          department: 'External',
          availability: '24/7'
        },
        {
          id: '4',
          name: 'Security Chief',
          role: 'Security Manager',
          phone: '+254700123456',
          email: 'security.chief@company.com',
          priority: 2,
          department: 'Security',
          availability: '24/7'
        },
        {
          id: '5',
          name: 'Facility Manager',
          role: 'Operations Manager',
          phone: '+254700123457',
          email: 'facility.manager@company.com',
          priority: 3,
          department: 'Operations',
          availability: 'business_hours'
        }
      ];

      setActiveAlerts(mockActiveAlerts);
      setAlertHistory(mockAlertHistory);
      setNotificationChannels(mockNotificationChannels);
      setEmergencyContacts(mockEmergencyContacts);

    } catch (error) {
      console.error('Failed to load emergency data:', error);
    }
  };

  const setupRealTimeMonitoring = () => {
    // Set up real-time monitoring for emergency alerts
    const interval = setInterval(async () => {
      await loadEmergencyData();
      // Check system health
      await checkSystemHealth();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  };

  const checkSystemHealth = async () => {
    try {
      // Mock system health check
      const healthCheck = {
        paSystem: true,
        sirenSystem: true,
        smsGateway: true,
        emailService: true,
        database: true
      };

      const allSystemsOperational = Object.values(healthCheck).every(status => status);
      setSystemStatus(allSystemsOperational ? 'operational' : 'error');

    } catch (error) {
      setSystemStatus('error');
      console.error('System health check failed:', error);
    }
  };

  const createEmergencyAlert = async () => {
    if (!newAlert.title || !newAlert.message || !newAlert.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const alert: EmergencyAlert = {
      id: Date.now().toString(),
      ...newAlert,
      isActive: true,
      createdBy: userProfile?.email || 'Unknown',
      createdAt: new Date().toISOString(),
      acknowledgedBy: [],
      affectedAreas: newAlert.affectedAreas.filter(area => area.trim()),
      externalAuthorities: {
        police: newAlert.contactPolice,
        fire: newAlert.contactFire,
        medical: newAlert.contactMedical,
        contacted: false
      }
    };

    setActiveAlerts(prev => [alert, ...prev]);
    
    // Reset form
    setNewAlert({
      type: 'other',
      severity: 'medium',
      title: '',
      message: '',
      location: '',
      affectedAreas: [''],
      evacuationRequired: false,
      estimatedDuration: '',
      contactPolice: false,
      contactFire: false,
      contactMedical: false
    });
    setShowCreateAlert(false);

    // Trigger notifications
    await triggerEmergencyNotifications(alert);

    toast({
      title: "Emergency Alert Created",
      description: "Alert has been broadcast to all channels",
      variant: "destructive",
    });
  };

  const triggerEmergencyNotifications = async (alert: EmergencyAlert) => {
    // Activate appropriate notification channels based on severity
    const channelsToActivate = notificationChannels.filter(channel => {
      if (!channel.enabled) return false;
      
      if (alert.severity === 'critical') return true;
      if (alert.severity === 'high' && channel.priority <= 2) return true;
      if (alert.severity === 'medium' && channel.priority <= 3) return true;
      if (alert.severity === 'low' && channel.priority <= 4) return true;
      
      return false;
    });

    // Mock notification sending
    for (const channel of channelsToActivate) {
      console.log(`Sending ${alert.severity} alert via ${channel.type} to ${channel.recipients.join(', ')}`);
      
      // Update last used timestamp
      setNotificationChannels(prev => 
        prev.map(c => 
          c.id === channel.id 
            ? { ...c, lastUsed: new Date().toISOString() }
            : c
        )
      );
    }

    // Activate sirens and PA system for high/critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      setSirenActive(true);
      setBroadcastActive(true);
    }

    // Contact external authorities if required
    if (alert.externalAuthorities.police || alert.externalAuthorities.fire || alert.externalAuthorities.medical) {
      await contactExternalAuthorities(alert);
    }
  };

  const contactExternalAuthorities = async (alert: EmergencyAlert) => {
    const contactsToCall = emergencyContacts.filter(contact => {
      if (alert.externalAuthorities.police && contact.role === 'Law Enforcement') return true;
      if (alert.externalAuthorities.fire && contact.role === 'Fire & Rescue') return true;
      if (alert.externalAuthorities.medical && contact.role === 'Medical Services') return true;
      return false;
    });

    // Mock contacting authorities
    console.log('Contacting external authorities:', contactsToCall.map(c => c.name));
    
    // Update alert with contact information
    setActiveAlerts(prev => 
      prev.map(a => 
        a.id === alert.id 
          ? { 
              ...a, 
              externalAuthorities: {
                ...a.externalAuthorities,
                contacted: true,
                contactedAt: new Date().toISOString()
              }
            }
          : a
      )
    );

    toast({
      title: "Authorities Contacted",
      description: `${contactsToCall.length} emergency service(s) have been notified`,
    });
  };

  const acknowledgeAlert = async (alertId: string) => {
    const userEmail = userProfile?.email || 'Unknown';
    
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId && !alert.acknowledgedBy.includes(userEmail)
          ? { ...alert, acknowledgedBy: [...alert.acknowledgedBy, userEmail] }
          : alert
      )
    );

    toast({
      title: "Alert Acknowledged",
      description: "You have acknowledged this emergency alert",
    });
  };

  const resolveAlert = async (alertId: string) => {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) return;

    const resolvedAlert = {
      ...alert,
      isActive: false,
      resolvedAt: new Date().toISOString(),
      resolvedBy: userProfile?.email || 'Unknown'
    };

    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    setAlertHistory(prev => [resolvedAlert, ...prev]);

    // Deactivate sirens and PA system
    setSirenActive(false);
    setBroadcastActive(false);

    toast({
      title: "Alert Resolved",
      description: "Emergency alert has been marked as resolved",
    });
  };

  const testNotificationChannel = async (channelId: string) => {
    const channel = notificationChannels.find(c => c.id === channelId);
    if (!channel) return;

    // Mock testing notification channel
    console.log(`Testing ${channel.type} notification channel: ${channel.name}`);
    
    setNotificationChannels(prev => 
      prev.map(c => 
        c.id === channelId 
          ? { ...c, lastUsed: new Date().toISOString() }
          : c
      )
    );

    toast({
      title: "Test Sent",
      description: `Test notification sent via ${channel.name}`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return <Siren className="h-5 w-5 text-red-500" />;
      case 'medical': return <Phone className="h-5 w-5 text-blue-500" />;
      case 'security': return <Shield className="h-5 w-5 text-yellow-500" />;
      case 'evacuation': return <Users className="h-5 w-5 text-orange-500" />;
      case 'lockdown': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Siren className="h-8 w-8 animate-pulse mx-auto mb-4 text-red-500" />
          <p>Loading emergency alert system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Siren className="h-8 w-8 text-red-600" />
                Emergency Alert System
                {systemStatus === 'operational' && (
                  <Badge variant="default" className="bg-green-500">
                    OPERATIONAL
                  </Badge>
                )}
                {systemStatus === 'error' && (
                  <Badge variant="destructive">
                    SYSTEM ERROR
                  </Badge>
                )}
              </h1>
              <p className="mt-2 text-gray-600">
                Real-time emergency alert and notification system
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {sirenActive && (
                <div className="flex items-center gap-2 text-red-600 animate-pulse">
                  <Volume2 className="h-5 w-5" />
                  <span className="font-semibold">SIREN ACTIVE</span>
                </div>
              )}
              {broadcastActive && (
                <div className="flex items-center gap-2 text-orange-600 animate-pulse">
                  <Mic className="h-5 w-5" />
                  <span className="font-semibold">BROADCAST ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status Alert */}
        {systemStatus === 'error' && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">System Alert</AlertTitle>
            <AlertDescription className="text-red-600">
              One or more emergency notification systems are experiencing issues. Please check system diagnostics.
            </AlertDescription>
          </Alert>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Emergency Alerts ({activeAlerts.length})
            </h2>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Alert key={alert.id} className="border-red-200 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertTypeIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTitle className="text-red-700">{alert.title}</AlertTitle>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.evacuationRequired && (
                            <Badge variant="destructive">EVACUATION REQUIRED</Badge>
                          )}
                        </div>
                        <AlertDescription className="text-red-600 mb-3">
                          {alert.message}
                        </AlertDescription>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-red-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {alert.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {alert.acknowledgedBy.length} acknowledged
                          </span>
                        </div>
                        {alert.affectedAreas.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-red-700">Affected Areas: </span>
                            <span className="text-sm text-red-600">{alert.affectedAreas.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledgedBy.includes(userProfile?.email || '') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => setShowCreateAlert(true)}
            className="h-20 bg-red-600 hover:bg-red-700 flex flex-col items-center gap-2"
          >
            <Siren className="h-6 w-6" />
            <span>Create Emergency Alert</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col items-center gap-2"
            onClick={() => {
              setSirenActive(!sirenActive);
              toast({
                title: sirenActive ? "Siren Deactivated" : "Siren Activated",
                description: `Emergency siren has been ${sirenActive ? 'turned off' : 'activated'}`,
                variant: sirenActive ? "default" : "destructive",
              });
            }}
          >
            <Volume2 className="h-6 w-6" />
            <span>{sirenActive ? 'Deactivate Siren' : 'Activate Siren'}</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col items-center gap-2"
            onClick={() => {
              setBroadcastActive(!broadcastActive);
              toast({
                title: broadcastActive ? "PA System Off" : "PA System Active",
                description: `PA system has been ${broadcastActive ? 'deactivated' : 'activated'}`,
                variant: broadcastActive ? "default" : "destructive",
              });
            }}
          >
            <Mic className="h-6 w-6" />
            <span>{broadcastActive ? 'Stop PA Broadcast' : 'Start PA Broadcast'}</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col items-center gap-2"
            onClick={() => checkSystemHealth()}
          >
            <RotateCcw className="h-6 w-6" />
            <span>System Check</span>
          </Button>
        </div>

        {/* Create Alert Form */}
        {showCreateAlert && (
          <Card className="mb-8 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-700">Create Emergency Alert</CardTitle>
              <CardDescription>
                Broadcast an emergency alert to all notification channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Alert Type *</label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="fire">Fire Emergency</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="security">Security Alert</option>
                    <option value="evacuation">Evacuation Order</option>
                    <option value="lockdown">Lockdown</option>
                    <option value="weather">Weather Alert</option>
                    <option value="other">Other Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Severity *</label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    value={newAlert.location}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Emergency location"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alert Title *</label>
                <input
                  type="text"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief emergency description"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alert Message *</label>
                <textarea
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Detailed emergency instructions and information"
                  rows={3}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.evacuationRequired}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, evacuationRequired: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Evacuation Required</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.contactPolice}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, contactPolice: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Contact Police</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.contactFire}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, contactFire: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Contact Fire Department</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.contactMedical}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, contactMedical: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Contact Medical Services</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Duration</label>
                  <input
                    type="text"
                    value={newAlert.estimatedDuration}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="e.g., 30 minutes, 2 hours"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={createEmergencyAlert}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Siren className="h-4 w-4 mr-2" />
                  Broadcast Emergency Alert
                </Button>
                <Button variant="outline" onClick={() => setShowCreateAlert(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Channels Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {notificationChannels.map((channel) => (
                <div key={channel.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{channel.name}</h4>
                    <Badge variant={channel.status === 'active' ? 'default' : 'destructive'}>
                      {channel.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Type: {channel.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Recipients: {channel.recipients.length}
                  </p>
                  {channel.lastUsed && (
                    <p className="text-xs text-gray-500 mb-3">
                      Last used: {new Date(channel.lastUsed).toLocaleString()}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => testNotificationChannel(channel.id)}
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{contact.name}</h4>
                    <p className="text-sm text-gray-600">{contact.role} - {contact.department}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{contact.phone}</span>
                      <span>{contact.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {contact.availability}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Priority {contact.priority}</Badge>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alert History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Alert History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent alerts</p>
              ) : (
                alertHistory.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {getAlertTypeIcon(alert.type)}
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{alert.location}</span>
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                          {alert.resolvedAt && (
                            <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="default" className="bg-green-500">
                        RESOLVED
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyAlertSystem;
