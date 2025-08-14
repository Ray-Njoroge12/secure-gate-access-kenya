/**
 * Compliance Management Dashboard
 * Comprehensive compliance monitoring interface for GDPR, PDPA, ISO 27001, and other frameworks
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  complianceFramework,
  ComplianceFramework,
  ComplianceCategory,
  type ComplianceRequirement,
  type ComplianceMetrics,
  type ComplianceAudit,
  type ComplianceFinding
} from '@/services/complianceFramework';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Users,
  Lock,
  Activity,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  BookOpen,
  Zap
} from 'lucide-react';

interface ComplianceManagementProps {
  className?: string;
}

const ComplianceManagement: React.FC<ComplianceManagementProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | 'all'>('all');
  const [audits, setAudits] = useState<ComplianceAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load metrics
      const currentMetrics = complianceFramework.getComplianceMetrics();
      setMetrics(currentMetrics);

      // Load requirements
      const allRequirements = selectedFramework === 'all' 
        ? Array.from(Object.values(ComplianceFramework)).flatMap(framework => 
            complianceFramework.getRequirementsByFramework(framework)
          )
        : complianceFramework.getRequirementsByFramework(selectedFramework);
      setRequirements(allRequirements);

      // Load audits
      const allAudits = complianceFramework.getAudits();
      setAudits(allAudits);

      setIsLoading(false);
    };

    loadData();
  }, [selectedFramework]);

  const getFrameworkDisplayName = (framework: ComplianceFramework): string => {
    const names: Record<ComplianceFramework, string> = {
      [ComplianceFramework.GDPR]: 'GDPR',
      [ComplianceFramework.PDPA]: 'PDPA (Kenya)',
      [ComplianceFramework.ISO27001]: 'ISO 27001',
      [ComplianceFramework.SOC2]: 'SOC 2',
      [ComplianceFramework.NIST]: 'NIST',
      [ComplianceFramework.PCI_DSS]: 'PCI DSS',
      [ComplianceFramework.HIPAA]: 'HIPAA'
    };
    return names[framework];
  };

  const getCategoryDisplayName = (category: ComplianceCategory): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getComplianceScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 75) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const handleMarkImplemented = (requirementId: string) => {
    const success = complianceFramework.markImplemented(requirementId);
    if (success) {
      setRequirements(prev => 
        prev.map(req => 
          req.id === requirementId ? { ...req, implemented: true, lastAudit: new Date() } : req
        )
      );
      // Refresh metrics
      const updatedMetrics = complianceFramework.getComplianceMetrics();
      setMetrics(updatedMetrics);
    }
  };

  const handleRunAssessment = async () => {
    if (selectedFramework !== 'all') {
      const audit = await complianceFramework.conductAssessment(selectedFramework);
      setAudits(prev => [audit, ...prev]);
      
      // Refresh metrics
      const updatedMetrics = complianceFramework.getComplianceMetrics();
      setMetrics(updatedMetrics);
    }
  };

  const handleGenerateReport = () => {
    const report = complianceFramework.generateComplianceReport(
      selectedFramework === 'all' ? undefined : selectedFramework
    );
    
    // In a real implementation, this would generate and download a PDF
    console.log('Compliance Report:', report);
    
    // Create and download JSON for demo
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-report-${selectedFramework}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  const gaps = requirements.filter(req => !req.implemented);
  const criticalGaps = gaps.filter(req => req.mandatory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Compliance Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage regulatory compliance across frameworks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedFramework} 
            onChange={(e) => setSelectedFramework(e.target.value as ComplianceFramework | 'all')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Frameworks</option>
            {Object.values(ComplianceFramework).map(framework => (
              <option key={framework} value={framework}>
                {getFrameworkDisplayName(framework)}
              </option>
            ))}
          </select>
          
          <Button onClick={handleGenerateReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          {selectedFramework !== 'all' && (
            <Button onClick={handleRunAssessment} size="sm">
              <FileCheck className="w-4 h-4 mr-2" />
              Run Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Compliance Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              {getComplianceScoreIcon(metrics.overallScore)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getComplianceScoreColor(metrics.overallScore)}`}>
                {Math.round(metrics.overallScore)}%
              </div>
              <Progress value={metrics.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Implementation Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metrics.implementationRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Requirements implemented
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.criticalGaps}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.pendingActions}
              </div>
              <p className="text-xs text-muted-foreground">
                Tasks awaiting completion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalGaps.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Compliance Gaps:</strong> {criticalGaps.length} mandatory requirements are not implemented. 
            Immediate action required to avoid regulatory penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Framework Scores Grid */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Framework Compliance Scores</CardTitle>
            <CardDescription>
              Implementation status across regulatory frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(metrics.frameworkScores).map(([framework, score]) => (
                <div key={framework} className="text-center p-4 border rounded-lg">
                  <div className="font-medium mb-2">
                    {getFrameworkDisplayName(framework as ComplianceFramework)}
                  </div>
                  <div className={`text-2xl font-bold ${getComplianceScoreColor(score)}`}>
                    {Math.round(score)}%
                  </div>
                  <Progress value={score} className="mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements by Category */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Category</CardTitle>
            <CardDescription>
              Implementation status by compliance area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.categoryScores).map(([category, score]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{getCategoryDisplayName(category as ComplianceCategory)}</div>
                    <Progress value={score} className="mt-1" />
                  </div>
                  <div className={`ml-4 font-bold ${getComplianceScoreColor(score)}`}>
                    {Math.round(score)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activity</CardTitle>
          <CardDescription>
            Latest compliance updates and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {audits.slice(0, 5).map((audit, index) => (
              <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {getFrameworkDisplayName(audit.framework)} Assessment
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {audit.date.toLocaleDateString()} • {audit.findings.length} findings
                  </div>
                </div>
                <Badge className={getComplianceScoreColor(audit.overallScore)}>
                  {Math.round(audit.overallScore)}%
                </Badge>
              </div>
            ))}
            
            {audits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent compliance activity</p>
                <Button className="mt-4" onClick={handleRunAssessment} disabled={selectedFramework === 'all'}>
                  Run First Assessment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common compliance management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-auto p-4 flex flex-col items-center gap-2"
              variant="outline"
              onClick={handleGenerateReport}
            >
              <Download className="w-6 h-6" />
              <span>Generate Report</span>
              <span className="text-xs text-muted-foreground">Export compliance data</span>
            </Button>
            
            <Button 
              className="h-auto p-4 flex flex-col items-center gap-2"
              variant="outline"
              onClick={handleRunAssessment}
              disabled={selectedFramework === 'all'}
            >
              <FileCheck className="w-6 h-6" />
              <span>Run Assessment</span>
              <span className="text-xs text-muted-foreground">Evaluate compliance status</span>
            </Button>
            
            <Button 
              className="h-auto p-4 flex flex-col items-center gap-2"
              variant="outline"
              onClick={() => {
                const pdpaGaps = complianceFramework.getRequirementsByFramework(ComplianceFramework.PDPA)
                  .filter(req => !req.implemented);
                console.log('PDPA Gaps:', pdpaGaps);
              }}
            >
              <AlertTriangle className="w-6 h-6" />
              <span>Review Gaps</span>
              <span className="text-xs text-muted-foreground">Identify missing requirements</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceManagement;
