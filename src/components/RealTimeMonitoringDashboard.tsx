import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  RefreshCw, 
  Shield, 
  Wifi, 
  WifiOff,
  Bell,
  MapPin,
  Camera,
  Users,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealTimeAlert {
  id: string;
  type: 'security' | 'access' | 'system' | 'incident';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  location?: string;
  source?: string;
  metadata?: Record<string, any>;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'offline';
  authentication: 'healthy' | 'degraded' | 'offline';
  notifications: 'healthy' | 'degraded' | 'offline';
  camera_systems: 'healthy' | 'degraded' | 'offline';
  last_check: string;
  response_time: number;
}

interface LiveActivity {
  id: string;
  type: 'access_granted' | 'access_denied' | 'visitor_entry' | 'incident_reported' | 'guard_checkin';
  description: string;
  timestamp: string;
  location: string;
  status: 'success' | 'warning' | 'error';
  details?: Record<string, any>;
}

interface RealTimeMonitoringProps {
  currentLocation: string;
  onAlertAcknowledge: (alertId: string) => void;
  className?: string;
}

export function RealTimeMonitoringDashboard({ 
  currentLocation, 
  onAlertAcknowledge, 
  className = "" 
}: RealTimeMonitoringProps) {
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    authentication: 'healthy',
    notifications: 'healthy',
    camera_systems: 'healthy',
    last_check: new Date().toISOString(),
    response_time: 45
  });
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');

  // Real-time subscription management
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    console.log('🔴 Starting real-time monitoring...');

    try {
      // Subscribe to access code changes
      const accessCodeSubscription = supabase
        .channel('access-codes-monitor')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'access_codes' },
          (payload) => {
            handleAccessCodeEvent(payload);
          }
        )
        .subscribe();

      // Subscribe to visitor logs
      const visitorLogSubscription = supabase
        .channel('visitor-logs-monitor')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'visitor_logs' },
          (payload) => {
            handleVisitorLogEvent(payload);
          }
        )
        .subscribe();

      // Subscribe to incident reports
      const incidentSubscription = supabase
        .channel('incidents-monitor')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'incident_reports' },
          (payload) => {
            handleIncidentEvent(payload);
          }
        )
        .subscribe();

      // System health check interval
      const healthCheckInterval = setInterval(async () => {
        await performSystemHealthCheck();
      }, 30000); // Every 30 seconds

      // Cleanup function
      return () => {
        accessCodeSubscription.unsubscribe();
        visitorLogSubscription.unsubscribe();
        incidentSubscription.unsubscribe();
        clearInterval(healthCheckInterval);
        setIsMonitoring(false);
      };

    } catch (error) {
      console.error('Failed to start monitoring:', error);
      setConnectionStatus('offline');
      toast({
        title: "Monitoring Error",
        description: "Failed to start real-time monitoring",
        variant: "destructive",
      });
    }
  }, [isMonitoring]);

  const handleAccessCodeEvent = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && newRecord.used_at && !oldRecord.used_at) {
      // Access code was just used
      const activity: LiveActivity = {
        id: `access-${newRecord.id}-${Date.now()}`,
        type: 'access_granted',
        description: `Access granted to visitor`,
        timestamp: new Date().toISOString(),
        location: currentLocation,
        status: 'success',
        details: { accessCodeId: newRecord.id }
      };
      
      setLiveActivity(prev => [activity, ...prev.slice(0, 9)]);
      
      // Create success alert
      const alert: RealTimeAlert = {
        id: `alert-access-${newRecord.id}`,
        type: 'access',
        priority: 'low',
        title: 'Access Granted',
        message: `Visitor access verified at ${currentLocation}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        location: currentLocation,
        source: 'access_control'
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    }

    setLastUpdate(new Date());
  };

  const handleVisitorLogEvent = (payload: any) => {
    const { new: newRecord } = payload;
    
    const activity: LiveActivity = {
      id: `visitor-${newRecord.id}-${Date.now()}`,
      type: 'visitor_entry',
      description: `New visitor entry logged`,
      timestamp: new Date().toISOString(),
      location: currentLocation,
      status: 'success',
      details: { visitorLogId: newRecord.id }
    };
    
    setLiveActivity(prev => [activity, ...prev.slice(0, 9)]);

    // Create notification alert
    const alert: RealTimeAlert = {
      id: `alert-visitor-${newRecord.id}`,
      type: 'security',
      priority: 'medium',
      title: 'Visitor Entry',
      message: `New visitor logged entry at ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      location: currentLocation,
      source: 'visitor_tracking'
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    setLastUpdate(new Date());
  };

  const handleIncidentEvent = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      const activity: LiveActivity = {
        id: `incident-${newRecord.id}-${Date.now()}`,
        type: 'incident_reported',
        description: `Security incident reported: ${newRecord.incident_type || 'General'}`,
        timestamp: new Date().toISOString(),
        location: newRecord.location || currentLocation,
        status: 'warning',
        details: { incidentId: newRecord.id, type: newRecord.incident_type }
      };
      
      setLiveActivity(prev => [activity, ...prev.slice(0, 9)]);

      // Create high-priority alert for incidents
      const alert: RealTimeAlert = {
        id: `alert-incident-${newRecord.id}`,
        type: 'incident',
        priority: newRecord.severity === 'critical' ? 'critical' : 'high',
        title: 'Security Incident',
        message: `${newRecord.incident_type || 'Security incident'} reported at ${newRecord.location || currentLocation}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        location: newRecord.location || currentLocation,
        source: 'incident_management',
        metadata: { severity: newRecord.severity, type: newRecord.incident_type }
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    }

    setLastUpdate(new Date());
  };

  const performSystemHealthCheck = async () => {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // Test authentication
      const { data: session } = await supabase.auth.getSession();

      const responseTime = Date.now() - startTime;
      
      setSystemHealth({
        database: dbError ? 'degraded' : 'healthy',
        authentication: session ? 'healthy' : 'degraded',
        notifications: 'healthy', // Placeholder - would test actual notification service
        camera_systems: 'healthy', // Placeholder - would test camera connections
        last_check: new Date().toISOString(),
        response_time: responseTime
      });

      setConnectionStatus('online');
      
    } catch (error) {
      console.error('System health check failed:', error);
      setSystemHealth(prev => ({
        ...prev,
        database: 'offline',
        authentication: 'offline',
        last_check: new Date().toISOString(),
        response_time: Date.now() - startTime
      }));
      setConnectionStatus('offline');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
    onAlertAcknowledge(alertId);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  // Start monitoring on component mount
  useEffect(() => {
    startMonitoring();
    return () => {
      setIsMonitoring(false);
    };
  }, [startMonitoring]);

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.priority === 'critical');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Monitoring
              {isMonitoring && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {connectionStatus === 'online' ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : connectionStatus === 'offline' ? (
                <WifiOff className="h-4 w-4 text-red-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
              )}
              <Badge variant={connectionStatus === 'online' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Last update: {lastUpdate.toLocaleTimeString()} • Response time: {systemHealth.response_time}ms
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-red-800">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                </span>
                <p className="text-sm text-red-600 mt-1">
                  {criticalAlerts[0]?.message}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => acknowledgeAlert(criticalAlerts[0]?.id)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Acknowledge
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(systemHealth).map(([key, value]) => {
              if (key === 'last_check' || key === 'response_time') return null;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      value === 'healthy' ? 'bg-green-500' :
                      value === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className={`text-sm capitalize ${getHealthStatusColor(value)}`}>
                      {value}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive">{unacknowledgedAlerts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(alert.priority)} ${
                      alert.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleTimeString()}
                          {alert.location && (
                            <>
                              <MapPin className="h-3 w-3 ml-2" />
                              {alert.location}
                            </>
                          )}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          Ack
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No recent alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {liveActivity.length > 0 ? (
              liveActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.timestamp).toLocaleTimeString()}
                      <MapPin className="h-3 w-3 ml-2" />
                      {activity.location}
                    </div>
                  </div>
                  
                  {activity.type === 'access_granted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {activity.type === 'visitor_entry' && <Users className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'incident_reported' && <AlertCircle className="h-4 w-4 text-red-600" />}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Monitoring for security events...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
