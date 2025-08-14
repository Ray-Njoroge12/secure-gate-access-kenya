/**
 * Security Monitoring Dashboard
 * Real-time security monitoring interface with threat detection and incident management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  securityMonitor, 
  SecurityEventType, 
  SecuritySeverity,
  type SecurityEvent, 
  type SecurityMetrics 
} from '@/services/securityMonitor';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Globe,
  Clock,
  TrendingUp,
  Eye,
  Lock,
  Zap,
  Target
} from 'lucide-react';

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [isLoading, setIsLoading] = useState(true);

  // Real-time data refresh
  useEffect(() => {
    const fetchData = () => {
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '1h':
          startTime.setHours(endTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(endTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(endTime.getDate() - 7);
          break;
      }

      const currentMetrics = securityMonitor.getSecurityMetrics({ start: startTime, end: endTime });
      const events = securityMonitor.getRecentEvents(50);
      
      setMetrics(currentMetrics);
      setRecentEvents(events);
      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  const getSeverityColor = (severity: SecuritySeverity): string => {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return 'bg-red-600 text-white';
      case SecuritySeverity.HIGH:
        return 'bg-orange-500 text-white';
      case SecuritySeverity.MEDIUM:
        return 'bg-yellow-500 text-black';
      case SecuritySeverity.LOW:
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getEventIcon = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case SecurityEventType.LOGIN_FAILURE:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        return <Target className="w-4 h-4 text-red-600" />;
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return <Eye className="w-4 h-4 text-orange-500" />;
      case SecurityEventType.MFA_ATTEMPT:
        return <Lock className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatEventType = (type: SecurityEventType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRiskLevelColor = (score: number): string => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleResolveEvent = (eventId: string) => {
    if (securityMonitor.resolveEvent(eventId)) {
      setRecentEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, resolved: true } : event
        )
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Monitoring
          </h1>
          <p className="text-muted-foreground">Real-time security monitoring and threat detection</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Security Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Security events detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalEvents > 0 ? Math.round((metrics.resolvedEvents / metrics.totalEvents) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.resolvedEvents}/{metrics.totalEvents} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRiskLevelColor(metrics.riskScore)}`}>
                {Math.round(metrics.riskScore)}
              </div>
              <Progress value={metrics.riskScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="users">User Risk</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Live feed of security events and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No security events in the selected time range</p>
                  </div>
                ) : (
                  recentEvents.map((event) => (
                    <div 
                      key={event.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                        event.resolved ? 'opacity-60' : ''
                      }`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-3">
                        {getEventIcon(event.type)}
                        <div>
                          <div className="font-medium">{formatEventType(event.type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.timestamp.toLocaleString()} • IP: {event.ipAddress}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {!event.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveEvent(event.id);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Details Modal/Panel */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  Detailed information about the selected security event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Event Type</label>
                    <p>{formatEventType(selectedEvent.type)}</p>
                  </div>
                  <div>
                    <label className="font-medium">Severity</label>
                    <Badge className={getSeverityColor(selectedEvent.severity)}>
                      {selectedEvent.severity}
                    </Badge>
                  </div>
                  <div>
                    <label className="font-medium">Timestamp</label>
                    <p>{selectedEvent.timestamp.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="font-medium">IP Address</label>
                    <p>{selectedEvent.ipAddress}</p>
                  </div>
                  <div>
                    <label className="font-medium">User Agent</label>
                    <p className="text-sm break-all">{selectedEvent.userAgent}</p>
                  </div>
                  <div>
                    <label className="font-medium">User ID</label>
                    <p>{selectedEvent.userId || 'N/A'}</p>
                  </div>
                </div>
                
                {Object.keys(selectedEvent.details).length > 0 && (
                  <div className="mt-4">
                    <label className="font-medium">Additional Details</label>
                    <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </Button>
                  {!selectedEvent.resolved && (
                    <Button onClick={() => handleResolveEvent(selectedEvent.id)}>
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Threat Analysis Tab */}
        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Threats</CardTitle>
                <CardDescription>Most frequent security events</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.topThreats.length ? (
                  <div className="space-y-2">
                    {metrics.topThreats.map((threat, index) => (
                      <div key={threat.type} className="flex items-center justify-between">
                        <span className="text-sm">{formatEventType(threat.type as SecurityEventType)}</span>
                        <Badge variant="secondary">{threat.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No threats detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Analysis</CardTitle>
                <CardDescription>Event distribution by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Globe className="w-8 h-8 mb-2" />
                  <p>Geographic analysis coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Risk Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Risk Users</CardTitle>
              <CardDescription>Users requiring enhanced monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Users className="w-8 h-8 mb-2" />
                <p>User risk analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Security system status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Monitor Status</label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </div>
                <div>
                  <label className="font-medium">Average Response Time</label>
                  <p>{metrics?.averageResponseTime || 0}s</p>
                </div>
                <div>
                  <label className="font-medium">Events Buffer Size</label>
                  <p>{recentEvents.length} events</p>
                </div>
                <div>
                  <label className="font-medium">Last Update</label>
                  <p>{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Alerts */}
      {recentEvents.some(e => e.severity === SecuritySeverity.CRITICAL && !e.resolved) && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {
              recentEvents.filter(e => e.severity === SecuritySeverity.CRITICAL && !e.resolved).length
            } unresolved critical security events require immediate attention.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityDashboard;
