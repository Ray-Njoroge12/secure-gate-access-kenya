import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { performanceMonitor, WebVitals, PerformanceMetrics } from '@/services/performanceService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceDashboard: React.FC = () => {
  const [webVitals, setWebVitals] = useState<Partial<WebVitals>>({});
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    const updateData = () => {
      setWebVitals(performanceMonitor.getWebVitals());
      setMetrics(performanceMonitor.getMetrics());
      setReport(performanceMonitor.generateReport());
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getVitalStatus = (vital: string, value: number | undefined) => {
    if (!value) return 'unknown';
    
    switch (vital) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'FID':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = metrics.slice(-10).map((metric, index) => ({
    name: `${metric.componentName}-${index}`,
    renderTime: metric.renderTime,
    mountTime: metric.mountTime,
    updateTime: metric.updateTime || 0
  }));

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button onClick={downloadReport}>Download Report</Button>
      </div>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(webVitals).map(([vital, value]) => {
              const status = getVitalStatus(vital, value);
              return (
                <div key={vital} className="text-center">
                  <div className="text-2xl font-bold">
                    {value ? value.toFixed(2) : 'N/A'}
                    {vital !== 'CLS' && 'ms'}
                  </div>
                  <div className="text-sm text-gray-600">{vital}</div>
                  <Badge className={`mt-1 ${getStatusColor(status)}`}>
                    {status.replace('-', ' ')}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Component Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Component Performance (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="renderTime" fill="#8884d8" name="Render Time (ms)" />
              <Bar dataKey="mountTime" fill="#82ca9d" name="Mount Time (ms)" />
              <Bar dataKey="updateTime" fill="#ffc658" name="Update Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
            {report}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};