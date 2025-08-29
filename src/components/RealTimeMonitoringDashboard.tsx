import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TrendingUp,
  X,
  Check
} from 'lucide-react';
import apiClient from "@/lib/apiClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useToast } from "@/hooks/use-toast";

interface RealTimeAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

interface LiveStats {
  active_visitors: number;
  pending_verifications: number;
  today_entries: number;
  active_alerts: number;
  system_health: string;
  last_update: string;
}

interface LiveActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  location?: string;
  status: string;
  details?: Record<string, any>;
}

interface RealTimeMonitoringProps {
  currentLocation?: string;
  className?: string;
}

export function RealTimeMonitoringDashboard({
  currentLocation = "Main Gate",
  className = ""
}: RealTimeMonitoringProps) {
  const { toast } = useToast();
  const { session } = useAuthSession();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    active_visitors: 0,
    pending_verifications: 0,
    today_entries: 0,
    active_alerts: 0,
    system_health: "healthy",
    last_update: new Date().toISOString()
  });
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');
  const [acknowledgingAlerts, setAcknowledgingAlerts] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!session?.user?.id) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/monitoring/${session.user.id}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔴 WebSocket connected for real-time monitoring');
        setConnectionStatus('online');
        setIsMonitoring(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setConnectionStatus('offline');
        setIsMonitoring(false);

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('reconnecting');
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('offline');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('offline');
    }
  }, [session?.user?.id]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_alert':
        const newAlert = data.data;
        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);

        // Show toast notification for high-priority alerts
        if (newAlert.severity === 'high' || newAlert.severity === 'critical') {
          toast({
            title: newAlert.title,
            description: newAlert.message,
            variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
          });
        }
        break;

      case 'alert_acknowledged':
        const { alert_id } = data.data;
        setAlerts(prev => prev.map(alert =>
          alert.id === alert_id ? { ...alert, acknowledged: true } : alert
        ));
        break;

      case 'live_stats_update':
        setLiveStats(data.data);
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }

    setLastUpdate(new Date());
  }, [toast]);

  // Fetch initial data and setup monitoring
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    try {
      // Fetch initial alerts
      const alertsResponse = await apiClient.get('/realtime/alerts');
      setAlerts(alertsResponse.data.alerts || []);

      // Fetch initial stats
      const statsResponse = await apiClient.get('/realtime/stats');
      setLiveStats(statsResponse.data);

      // Connect WebSocket
      connectWebSocket();

      // Setup periodic stats refresh as fallback
      statsIntervalRef.current = setInterval(async () => {
        try {
          const statsResponse = await apiClient.get('/realtime/stats');
          setLiveStats(statsResponse.data);
        } catch (error) {
          console.error('Failed to fetch live stats:', error);
        }
      }, 30000); // Every 30 seconds

    } catch (error) {
      console.error('Failed to start monitoring:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to start real-time monitoring",
        variant: "destructive",
      });
    }
  }, [isMonitoring, connectWebSocket, toast]);

  const stopMonitoring = useCallback(() => {
    disconnectWebSocket();

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    setIsMonitoring(false);
    setConnectionStatus('offline');
  }, [disconnectWebSocket]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (acknowledgingAlerts.has(alertId)) return;

    setAcknowledgingAlerts(prev => new Set(prev).add(alertId));

    try {
      await apiClient.post(`/realtime/alerts/${alertId}/acknowledge`, {
        guard_id: session?.user?.id
      });

      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged",
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    } finally {
      setAcknowledgingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  }, [session?.user?.id, acknowledgingAlerts, toast]);

  // Manual refresh
  const refreshData = useCallback(async () => {
    try {
      const [alertsResponse, statsResponse] = await Promise.all([
        apiClient.get('/realtime/alerts'),
        apiClient.get('/realtime/stats')
      ]);

      setAlerts(alertsResponse.data.alerts || []);
      setLiveStats(statsResponse.data);
      setLastUpdate(new Date());

      toast({
        title: "Data Refreshed",
        description: "Real-time data has been updated",
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh monitoring data",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Setup and cleanup
  useEffect(() => {
    if (session?.user?.id) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [session?.user?.id, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [disconnectWebSocket]);

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Live security monitoring and incident management
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'online' ? 'bg-green-500' :
              connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium capitalize">
              {connectionStatus === 'reconnecting' ? 'Reconnecting...' : connectionStatus}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={connectionStatus === 'reconnecting'}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={!isMonitoring}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Last Update Indicator */}
      {lastUpdate && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Live Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats?.active_visitors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently on premises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Attempts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats?.access_attempts_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats?.active_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats?.system_health === 'healthy' ? 'Good' :
               liveStats?.system_health === 'warning' ? 'Warning' : 'Critical'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Alerts
          </CardTitle>
          <CardDescription>
            Real-time security alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      {alert.details && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {alert.details}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={acknowledgingAlerts.has(alert.id)}
                        >
                          {acknowledgingAlerts.has(alert.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-xs">Acknowledged</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest security events and system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {liveStats?.recent_activities?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveStats?.recent_activities?.map((activity: LiveActivity, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'access_granted' ? 'bg-green-500' :
                    activity.type === 'access_denied' ? 'bg-red-500' :
                    activity.type === 'incident' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
