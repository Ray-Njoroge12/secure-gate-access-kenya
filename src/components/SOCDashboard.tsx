/**
 * Security Operations Center (SOC) Dashboard
 * Unified security monitoring and incident response interface
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
  securityPolicyService,
  PolicyCategory,
  type SecurityPolicy,
  type PolicyViolation
} from '@/services/securityPolicyService';
import {
  complianceFramework,
  ComplianceFramework,
  type ComplianceMetrics
} from '@/services/complianceFramework';
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Lock,
  Users,
  FileCheck,
  Zap,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  Database,
  Network,
  Key
} from 'lucide-react';

interface SOCDashboardProps {
  className?: string;
}

const SOCDashboard: React.FC<SOCDashboardProps> = ({ className }) => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      // Load security metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours
      const secMetrics = securityMonitor.getSecurityMetrics({ start: startTime, end: endTime });
      setSecurityMetrics(secMetrics);

      // Load compliance metrics
      const compMetrics = complianceFramework.getComplianceMetrics();
      setComplianceMetrics(compMetrics);

      // Load recent events
      const events = securityMonitor.getRecentEvents(20);
      setRecentEvents(events);

      // Load security policies
      const secPolicies = securityPolicyService.getPolicies();
      setPolicies(secPolicies);

      // Load policy violations
      const policyViolations = securityPolicyService.getViolations({ limit: 20 });
      setViolations(policyViolations);

      // Calculate threat level
      const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL).length;
      const highEvents = events.filter(e => e.severity === SecuritySeverity.HIGH).length;
      
      if (criticalEvents > 0) {
        setThreatLevel('critical');
      } else if (highEvents > 2) {
        setThreatLevel('high');
      } else if (highEvents > 0) {
        setThreatLevel('medium');
      } else {
        setThreatLevel('low');
      }

      setIsLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'high': return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'medium': return <Eye className="w-6 h-6 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-6 h-6 text-green-600" />;
      default: return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

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

  const handleResolveViolation = (violationId: string) => {
    const success = securityPolicyService.resolveViolation(violationId, 'manually_resolved');
    if (success) {
      setViolations(prev => 
        prev.map(v => v.id === violationId ? { ...v, resolved: true } : v)
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading security operations data...</p>
        </div>
      </div>
    );
  }

  const unresolvedViolations = violations.filter(v => !v.resolved);
  const criticalEvents = recentEvents.filter(e => e.severity === SecuritySeverity.CRITICAL);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Operations Center
          </h1>
          <p className="text-muted-foreground">Unified security monitoring and incident response</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Threat Level Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getThreatLevelColor(threatLevel)}`}>
            {getThreatLevelIcon(threatLevel)}
            <span className="font-medium">Threat Level: {threatLevel.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {criticalEvents.length} critical security events require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unresolvedViolations.length}</div>
            <p className="text-xs text-muted-foreground">
              Unresolved violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(complianceMetrics?.overallScore || 0)}%
            </div>
            <Progress value={complianceMetrics?.overallScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.averageResponseTime || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Average incident response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest security incidents and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.timestamp.toLocaleString()} • {event.ipAddress}
                        </div>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Active security policy status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policies.filter(p => p.active).slice(0, 8).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{policy.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {policy.category.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={policy.enforcement === 'strict' ? 'default' : 'secondary'}>
                          {policy.enforcement}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Health Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Security Health Indicators</CardTitle>
              <CardDescription>Key security metrics and system status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Data Protection</div>
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-muted-foreground">Encryption coverage</div>
                </div>
                
                <div className="text-center">
                  <Network className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Network Security</div>
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-muted-foreground">Firewall effectiveness</div>
                </div>
                
                <div className="text-center">
                  <Key className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Access Control</div>
                  <div className="text-2xl font-bold text-yellow-600">87%</div>
                  <div className="text-sm text-muted-foreground">MFA adoption</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Incidents</CardTitle>
              <CardDescription>Incidents requiring attention and response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.filter(e => e.severity === SecuritySeverity.CRITICAL || e.severity === SecuritySeverity.HIGH).map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {event.timestamp.toLocaleString()} • Source: {event.ipAddress}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Investigate</Button>
                      <Button size="sm">Respond</Button>
                    </div>
                  </div>
                ))}
                
                {recentEvents.filter(e => e.severity === SecuritySeverity.CRITICAL || e.severity === SecuritySeverity.HIGH).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No active critical incidents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy Violations</CardTitle>
                <CardDescription>Recent security policy violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {violations.slice(0, 10).map((violation) => (
                    <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{violation.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {violation.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={violation.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {violation.severity}
                        </Badge>
                        {!violation.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveViolation(violation.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Management</CardTitle>
                <CardDescription>Configure and manage security policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(PolicyCategory).map((category) => {
                    const categoryPolicies = policies.filter(p => p.category === category);
                    const activePolicies = categoryPolicies.filter(p => p.active);
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activePolicies.length}/{categoryPolicies.length} active
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceMetrics && Object.entries(complianceMetrics.frameworkScores).map(([framework, score]) => (
              <Card key={framework}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {framework.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-green-600">
                    {Math.round(score)}%
                  </div>
                  <Progress value={score} className="mb-4" />
                  <div className="text-sm text-muted-foreground">
                    Compliance Score
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
              <CardDescription>Trends and insights from security data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Top Threat Categories</h3>
                  <div className="space-y-2">
                    {securityMetrics?.topThreats.map((threat, index) => (
                      <div key={threat.type} className="flex items-center justify-between">
                        <span className="text-sm">{threat.type.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary">{threat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Security Trends</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Authentication security improved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Network intrusion attempts increased</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Policy violations stable</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SOCDashboard;
