import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  LineChart as LineChartIcon,
  Network,
  Workflow,
  Building2,
  Shield,
  Server,
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  Globe2,
  Database
} from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectorHealth { name: string; status: 'healthy' | 'degraded' | 'down'; latency: number; uptime: number; lastSync: string; };
interface WorkflowMetric { name: string; executions: number; successRate: number; avgDuration: number; };
interface LocationPerformance { location: string; visitors: number; incidents: number; sla: number; capacityUtilization: number; };
interface APIMetric { endpoint: string; calls: number; errors: number; p95: number; };
interface SecurityDistribution { type: string; count: number; };

interface EnterpriseAnalyticsState {
  connectorHealth: ConnectorHealth[];
  workflowMetrics: WorkflowMetric[];
  locationPerformance: LocationPerformance[];
  apiMetrics: APIMetric[];
  securityDistribution: SecurityDistribution[];
  costEstimates: { category: string; monthly: number; trend: 'up' | 'down' | 'flat'; }[];
  kpis: {
    integrationUptime: number;
    workflowSuccess: number;
    averageAPILatency: number;
    multiLocationSLA: number;
    securityIncidentMTTR: number;
  };
}

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#6366f1'];

const EnterpriseAnalyticsHub: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnterpriseAnalyticsState | null>(null);
  const [period, setPeriod] = useState<'day'|'week'|'month'|'quarter'>('week');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // NOTE: These are currently mock aggregations; replace with Supabase RPC / SQL views later.
      const mock: EnterpriseAnalyticsState = {
        connectorHealth: [
          { name: 'LDAP / AD', status: 'healthy', latency: 180, uptime: 99.92, lastSync: '2m ago' },
          { name: 'HR / ERP', status: 'degraded', latency: 420, uptime: 98.75, lastSync: '5m ago' },
          { name: 'Email SMTP', status: 'healthy', latency: 95, uptime: 99.99, lastSync: '30s ago' },
          { name: 'IoT Gateway', status: 'healthy', latency: 210, uptime: 99.61, lastSync: '1m ago' },
          { name: 'BMS System', status: 'down', latency: 0, uptime: 94.12, lastSync: '17m ago' }
        ],
        workflowMetrics: [
          { name: 'Visitor Onboarding', executions: 342, successRate: 97.8, avgDuration: 48 },
          { name: 'Access Provisioning', executions: 189, successRate: 95.1, avgDuration: 62 },
          { name: 'Incident Escalation', executions: 34, successRate: 91.2, avgDuration: 12 },
          { name: 'Key Rotation', executions: 18, successRate: 100, avgDuration: 5 }
        ],
        locationPerformance: [
          { location: 'Nairobi HQ', visitors: 1280, incidents: 3, sla: 99.5, capacityUtilization: 72 },
          { location: 'Mombasa Branch', visitors: 640, incidents: 1, sla: 99.9, capacityUtilization: 54 },
          { location: 'Kisumu Annex', visitors: 320, incidents: 0, sla: 100, capacityUtilization: 41 },
          { location: 'Eldoret Logistics', visitors: 850, incidents: 2, sla: 99.2, capacityUtilization: 63 }
        ],
        apiMetrics: [
          { endpoint: 'POST /access/verify', calls: 8421, errors: 32, p95: 280 },
          { endpoint: 'GET /invitations', calls: 5640, errors: 21, p95: 190 },
          { endpoint: 'POST /workflows/execute', calls: 1320, errors: 18, p95: 410 },
          { endpoint: 'GET /integrations/status', calls: 2210, errors: 4, p95: 155 }
        ],
        securityDistribution: [
          { type: 'Access Denied', count: 42 },
          { type: 'Policy Violation', count: 12 },
          { type: 'Failed Auth', count: 28 },
          { type: 'Anomaly', count: 7 }
        ],
        costEstimates: [
          { category: 'API Invocations', monthly: 420, trend: 'up' },
          { category: 'Storage', monthly: 155, trend: 'flat' },
          { category: 'Edge Functions', monthly: 210, trend: 'down' },
          { category: 'Data Transfer', monthly: 95, trend: 'up' }
        ],
        kpis: {
          integrationUptime: 99.42,
          workflowSuccess: 96.8,
          averageAPILatency: 235,
          multiLocationSLA: 99.62,
          securityIncidentMTTR: 14.2
        }
      };
      setData(mock);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast({ title: 'Load Failed', description: 'Unable to load enterprise analytics.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);
  useEffect(() => {
    if (!autoRefresh) return; const id = setInterval(fetchData, 45000); return () => clearInterval(id);
  }, [autoRefresh, period]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading enterprise analytics…</p>
      </div>
    );
  }

  const averageWorkflowLatency = data.workflowMetrics.reduce((a,b)=>a+b.avgDuration,0)/data.workflowMetrics.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LineChartIcon className="h-7 w-7 text-primary" /> Enterprise Analytics Hub
          </h1>
          <p className="text-muted-foreground">Cross-domain intelligence across integrations, workflows, locations, security & APIs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={period}
            onChange={e=>setPeriod(e.target.value as typeof period)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
          <Button size="sm" variant={autoRefresh? 'default':'outline'} onClick={()=>setAutoRefresh(a=>!a)}>
            <Activity className="h-4 w-4 mr-1" /> Auto
          </Button>
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Last updated {lastUpdated.toLocaleTimeString()}</div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium">Integration Uptime</CardTitle><Network className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.integrationUptime.toFixed(2)}%</div><Progress value={data.kpis.integrationUptime} className="mt-2" /></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium">Workflow Success</CardTitle><Workflow className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.workflowSuccess.toFixed(1)}%</div><Progress value={data.kpis.workflowSuccess} className="mt-2" /></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium">Avg API P95</CardTitle><Server className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.averageAPILatency}ms</div><p className="text-xs text-muted-foreground">Target &lt;300ms</p></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium">Location SLA</CardTitle><Globe2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.multiLocationSLA.toFixed(2)}%</div><Progress value={data.kpis.multiLocationSLA} className="mt-2" /></CardContent></Card>
        <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium">Incident MTTR</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.securityIncidentMTTR.toFixed(1)}m</div><p className="text-xs text-muted-foreground">Mean Time to Resolve</p></CardContent></Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connector Health</CardTitle>
                <CardDescription>Latency, uptime & sync status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.connectorHealth.map(c => (
                  <div key={c.name} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium flex items-center gap-2">{c.name}{c.status==='degraded' && <Badge variant="outline" className="text-amber-600 border-amber-300">Degraded</Badge>}{c.status==='down' && <Badge variant="destructive">Down</Badge>}</p>
                      <p className="text-xs text-muted-foreground">Last sync {c.lastSync}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs">Latency <span className="font-medium">{c.latency? c.latency+'ms':'—'}</span></p>
                      <Progress value={c.uptime} className="h-1" />
                      <p className="text-[10px] text-muted-foreground">Uptime {c.uptime.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Integration Stability Trend</CardTitle>
                <CardDescription>P95 latency by connector</CardDescription>
              </CardHeader>
              <CardContent style={{height:300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.connectorHealth.map(h=>({ name: h.name, latency: h.latency || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Throughput</CardTitle>
                <CardDescription>Executions per workflow</CardDescription>
              </CardHeader>
              <CardContent style={{height:300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.workflowMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="executions" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Success & Duration</CardTitle>
                <CardDescription>Success rate vs avg duration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.workflowMetrics.map(w => (
                  <div key={w.name} className="flex items-center justify-between">
                    <div className="w-1/3 text-sm font-medium truncate" title={w.name}>{w.name}</div>
                    <div className="flex-1 px-2">
                      <Progress value={w.successRate} className="h-2" />
                    </div>
                    <div className="w-20 text-right text-xs">{w.successRate.toFixed(1)}%</div>
                    <div className="w-20 text-right text-xs text-muted-foreground">{w.avgDuration}m</div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">Avg execution duration {averageWorkflowLatency.toFixed(1)}m</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Performance</CardTitle>
              <CardDescription>Visitors, incidents & SLA adherence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.locationPerformance.map(loc => (
                <div key={loc.location} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center border rounded-md p-3">
                  <p className="font-medium text-sm col-span-2 md:col-span-1">{loc.location}</p>
                  <p className="text-xs"><span className="font-semibold">Visitors:</span> {loc.visitors}</p>
                  <p className="text-xs"><span className="font-semibold">Incidents:</span> {loc.incidents}</p>
                  <div className="text-xs"><span className="font-semibold">SLA:</span> {loc.sla.toFixed(2)}%</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">Capacity</span>
                    <div className="flex-1"><Progress value={loc.capacityUtilization} className="h-2" /></div>
                    <span>{loc.capacityUtilization}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* APIs */}
        <TabsContent value="apis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Usage Volume</CardTitle>
                <CardDescription>Call volume per endpoint</CardDescription>
              </CardHeader>
              <CardContent style={{height:300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.apiMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Error & Latency Profile</CardTitle>
                <CardDescription>Error rate & p95 latency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.apiMetrics.map(api => {
                  const errorRate = api.calls ? (api.errors / api.calls) * 100 : 0;
                  return (
                    <div key={api.endpoint} className="flex items-center gap-2 text-xs">
                      <div className="w-40 truncate" title={api.endpoint}>{api.endpoint}</div>
                      <div className="flex-1"><Progress value={Math.min(errorRate,100)} className="h-2" /></div>
                      <div className="w-16 text-right">{errorRate.toFixed(2)}%</div>
                      <div className="w-16 text-right text-muted-foreground">{api.p95}ms</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events Distribution</CardTitle>
                <CardDescription>Breakdown of event categories</CardDescription>
              </CardHeader>
              <CardContent style={{height:300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.securityDistribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={(p)=>`${p.name}`}> 
                      {data.securityDistribution.map((s,i)=>(<Cell key={s.type} fill={COLORS[i%COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {data.securityDistribution.map((s,i)=>(
                    <Badge key={s.type} variant="outline" className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{background: COLORS[i%COLORS.length]}} />
                      {s.type} ({s.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cost & Resource Overview</CardTitle>
                <CardDescription>Estimated monthly platform costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.costEstimates.map(c => (
                  <div key={c.category} className="flex items-center justify-between text-xs border rounded-md p-2">
                    <span className="font-medium">{c.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${c.monthly}</span>
                      {c.trend==='up' && <Badge variant="destructive">↑</Badge>}
                      {c.trend==='down' && <Badge className="bg-green-500 text-white">↓</Badge>}
                      {c.trend==='flat' && <Badge variant="outline">→</Badge>}
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">Costs are indicative; connect billing API for real values.</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Cross-Domain Correlations</CardTitle>
              <CardDescription>Derived insights linking operational signals</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> API Latency vs Incidents</p>
                <p>Spikes in API p95 above 400ms correlate with +18% failed access attempts.</p>
              </div>
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Connector Degradation Impact</p>
                <p>ERP latency degradation increased workflow execution time by 9%.</p>
              </div>
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><Building2 className="h-3 w-3" /> Location SLA & Security</p>
                <p>Locations with SLA &lt;99.3% show 2x anomaly alerts per 1K visitors.</p>
              </div>
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><Workflow className="h-3 w-3" /> Workflow Success Drivers</p>
                <p>Key rotation workflow reliability raises overall security success by 3%.</p>
              </div>
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><Server className="h-3 w-3" /> API Error Hotspot</p>
                <p>Most errors originate from /workflows/execute during peak 13:00-14:00 window.</p>
              </div>
              <div className="p-3 border rounded-md text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><Database className="h-3 w-3" /> Data Quality Signal</p>
                <p>5% of invitations missing purpose metadata – impacts purpose analytics fidelity.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseAnalyticsHub;
