import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Workflow,
  Play,
  Pause,
  Square,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Database,
  Code,
  Zap,
  Timer,
  Route,
  Filter,
  ArrowRight,
  ArrowDown,
  Diamond,
  Circle,
  Square as SquareIcon,
  RefreshCw,
  Eye,
  BarChart3,
  FileText,
  Send,
  UserCheck,
  UserX,
  Shield,
  Key,
  Lock,
  Unlock,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'approval' | 'delay' | 'notification';
  name: string;
  description: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'visitor' | 'security' | 'maintenance' | 'approval' | 'notification' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggers: string[];
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  };
  permissions: {
    canEdit: string[];
    canExecute: string[];
    canView: string[];
  };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: Workflow['category'];
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  tags: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  useCases: string[];
  requirements: string[];
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  currentNode?: string;
  executionLog: Array<{
    nodeId: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    timestamp: Date;
    duration: number;
  }>;
  variables: Record<string, any>;
  errorMessage?: string;
}

interface ApprovalRequest {
  id: string;
  workflowExecutionId: string;
  workflowName: string;
  nodeId: string;
  requestedBy: string;
  assignedTo: string[];
  requestDate: Date;
  dueDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  details: string;
  comments: Array<{
    user: string;
    message: string;
    timestamp: Date;
  }>;
  decision?: {
    approver: string;
    decision: 'approved' | 'rejected';
    reason: string;
    timestamp: Date;
  };
}

const WorkflowAutomationEngine: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [designerMode, setDesignerMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'visitor-approval',
      name: 'Visitor Approval Workflow',
      description: 'Automated approval process for visitor registration requests',
      category: 'visitor',
      complexity: 'intermediate',
      estimatedSetupTime: '20-30 minutes',
      tags: ['Visitor Management', 'Approval Process', 'Notifications'],
      useCases: [
        'VIP visitor requests requiring manager approval',
        'After-hours visitor access requests',
        'Large group visitor registration'
      ],
      requirements: [
        'Email notification system',
        'Manager role assignments',
        'Visitor registration module'
      ],
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Visitor Request Submitted',
          description: 'Triggered when a new visitor request is submitted',
          position: { x: 100, y: 100 },
          configuration: { event: 'visitor_request_created' },
          inputs: [],
          outputs: ['request-data']
        },
        {
          id: 'condition-1',
          type: 'condition',
          name: 'Requires Approval?',
          description: 'Check if visitor request requires manager approval',
          position: { x: 300, y: 100 },
          configuration: { 
            condition: 'visitor.type === "VIP" || visitor.afterHours === true || visitor.groupSize > 10' 
          },
          inputs: ['request-data'],
          outputs: ['approval-required', 'auto-approve']
        },
        {
          id: 'action-1',
          type: 'approval',
          name: 'Manager Approval',
          description: 'Send approval request to designated manager',
          position: { x: 500, y: 50 },
          configuration: { 
            assignee: 'manager',
            timeout: '24h',
            escalation: 'senior-manager'
          },
          inputs: ['approval-required'],
          outputs: ['approved', 'rejected']
        },
        {
          id: 'action-2',
          type: 'action',
          name: 'Auto Approve',
          description: 'Automatically approve standard visitor requests',
          position: { x: 500, y: 150 },
          configuration: { action: 'approve_visitor_request' },
          inputs: ['auto-approve'],
          outputs: ['approved']
        },
        {
          id: 'notification-1',
          type: 'notification',
          name: 'Send Approval Notification',
          description: 'Notify requester of approval decision',
          position: { x: 700, y: 100 },
          configuration: { 
            channels: ['email', 'sms'],
            template: 'visitor_approval_notification'
          },
          inputs: ['approved', 'rejected'],
          outputs: []
        }
      ],
      connections: [
        { id: 'conn-1', source: 'trigger-1', target: 'condition-1' },
        { id: 'conn-2', source: 'condition-1', target: 'action-1', condition: 'approval-required' },
        { id: 'conn-3', source: 'condition-1', target: 'action-2', condition: 'auto-approve' },
        { id: 'conn-4', source: 'action-1', target: 'notification-1' },
        { id: 'conn-5', source: 'action-2', target: 'notification-1' }
      ]
    },
    {
      id: 'security-incident',
      name: 'Security Incident Response',
      description: 'Automated response workflow for security incidents',
      category: 'security',
      complexity: 'advanced',
      estimatedSetupTime: '45-60 minutes',
      tags: ['Security', 'Incident Management', 'Emergency Response'],
      useCases: [
        'Unauthorized access attempts',
        'Security camera alerts',
        'Emergency evacuations'
      ],
      requirements: [
        'Security alert system',
        'Emergency notification channels',
        'Security team roles'
      ],
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Security Alert',
          description: 'Triggered by security system alerts',
          position: { x: 100, y: 100 },
          configuration: { event: 'security_alert_triggered' },
          inputs: [],
          outputs: ['alert-data']
        },
        {
          id: 'condition-1',
          type: 'condition',
          name: 'Severity Assessment',
          description: 'Evaluate the severity of the security incident',
          position: { x: 300, y: 100 },
          configuration: { 
            condition: 'alert.severity' 
          },
          inputs: ['alert-data'],
          outputs: ['high-severity', 'medium-severity', 'low-severity']
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Lock Down Areas',
          description: 'Automatically lock affected areas for high severity incidents',
          position: { x: 500, y: 50 },
          configuration: { action: 'lockdown_areas' },
          inputs: ['high-severity'],
          outputs: ['lockdown-complete']
        },
        {
          id: 'notification-1',
          type: 'notification',
          name: 'Emergency Notification',
          description: 'Send immediate alerts to security team and management',
          position: { x: 700, y: 50 },
          configuration: { 
            channels: ['sms', 'push', 'email'],
            recipients: ['security-team', 'management'],
            priority: 'urgent'
          },
          inputs: ['lockdown-complete', 'medium-severity'],
          outputs: []
        }
      ],
      connections: [
        { id: 'conn-1', source: 'trigger-1', target: 'condition-1' },
        { id: 'conn-2', source: 'condition-1', target: 'action-1', condition: 'high-severity' },
        { id: 'conn-3', source: 'condition-1', target: 'notification-1', condition: 'medium-severity' },
        { id: 'conn-4', source: 'action-1', target: 'notification-1' }
      ]
    },
    {
      id: 'maintenance-schedule',
      name: 'Maintenance Scheduling',
      description: 'Automated maintenance scheduling and notification workflow',
      category: 'maintenance',
      complexity: 'basic',
      estimatedSetupTime: '15-25 minutes',
      tags: ['Maintenance', 'Scheduling', 'Preventive'],
      useCases: [
        'Regular equipment maintenance',
        'Facility cleaning schedules',
        'Security system checks'
      ],
      requirements: [
        'Calendar integration',
        'Maintenance team assignments',
        'Asset management system'
      ],
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Scheduled Trigger',
          description: 'Runs on a predefined schedule',
          position: { x: 100, y: 100 },
          configuration: { schedule: 'weekly', time: '09:00' },
          inputs: [],
          outputs: ['schedule-triggered']
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Create Maintenance Tasks',
          description: 'Generate maintenance tasks for scheduled items',
          position: { x: 300, y: 100 },
          configuration: { action: 'create_maintenance_tasks' },
          inputs: ['schedule-triggered'],
          outputs: ['tasks-created']
        },
        {
          id: 'notification-1',
          type: 'notification',
          name: 'Notify Maintenance Team',
          description: 'Send task assignments to maintenance team',
          position: { x: 500, y: 100 },
          configuration: { 
            channels: ['email', 'mobile'],
            recipients: ['maintenance-team']
          },
          inputs: ['tasks-created'],
          outputs: []
        }
      ],
      connections: [
        { id: 'conn-1', source: 'trigger-1', target: 'action-1' },
        { id: 'conn-2', source: 'action-1', target: 'notification-1' }
      ]
    }
  ];

  const fetchWorkflowData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate fetching workflow data
      const mockWorkflows: Workflow[] = [
        {
          id: 'wf-001',
          name: 'VIP Visitor Approval',
          description: 'Approval workflow for VIP visitor requests',
          category: 'visitor',
          status: 'active',
          version: '1.2',
          createdBy: 'admin@securegate.com',
          createdAt: new Date('2025-08-01'),
          updatedAt: new Date('2025-08-10'),
          nodes: workflowTemplates[0].nodes,
          connections: workflowTemplates[0].connections,
          triggers: ['visitor_request_created'],
          statistics: {
            totalExecutions: 847,
            successfulExecutions: 823,
            failedExecutions: 24,
            averageExecutionTime: 45.6,
            lastExecution: new Date('2025-08-13T09:30:00')
          },
          permissions: {
            canEdit: ['admin', 'workflow-manager'],
            canExecute: ['admin', 'manager', 'receptionist'],
            canView: ['admin', 'manager', 'receptionist', 'security']
          }
        },
        {
          id: 'wf-002',
          name: 'Security Alert Response',
          description: 'Automated response to security incidents',
          category: 'security',
          status: 'active',
          version: '2.1',
          createdBy: 'security@securegate.com',
          createdAt: new Date('2025-07-15'),
          updatedAt: new Date('2025-08-05'),
          nodes: workflowTemplates[1].nodes,
          connections: workflowTemplates[1].connections,
          triggers: ['security_alert_triggered'],
          statistics: {
            totalExecutions: 156,
            successfulExecutions: 148,
            failedExecutions: 8,
            averageExecutionTime: 12.3,
            lastExecution: new Date('2025-08-12T14:22:00')
          },
          permissions: {
            canEdit: ['admin', 'security-manager'],
            canExecute: ['admin', 'security-manager', 'security-guard'],
            canView: ['admin', 'security-manager', 'security-guard']
          }
        },
        {
          id: 'wf-003',
          name: 'Weekly Maintenance',
          description: 'Automated weekly maintenance scheduling',
          category: 'maintenance',
          status: 'active',
          version: '1.0',
          createdBy: 'maintenance@securegate.com',
          createdAt: new Date('2025-07-20'),
          updatedAt: new Date('2025-07-20'),
          nodes: workflowTemplates[2].nodes,
          connections: workflowTemplates[2].connections,
          triggers: ['scheduled_weekly'],
          statistics: {
            totalExecutions: 24,
            successfulExecutions: 24,
            failedExecutions: 0,
            averageExecutionTime: 8.9,
            lastExecution: new Date('2025-08-12T09:00:00')
          },
          permissions: {
            canEdit: ['admin', 'maintenance-manager'],
            canExecute: ['admin', 'maintenance-manager'],
            canView: ['admin', 'maintenance-manager', 'maintenance-staff']
          }
        }
      ];

      const mockExecutions: WorkflowExecution[] = [
        {
          id: 'exec-001',
          workflowId: 'wf-001',
          status: 'completed',
          startedAt: new Date('2025-08-13T09:30:00'),
          completedAt: new Date('2025-08-13T09:32:15'),
          triggeredBy: 'visitor-portal',
          executionLog: [
            {
              nodeId: 'trigger-1',
              status: 'success',
              message: 'Visitor request received for John Doe',
              timestamp: new Date('2025-08-13T09:30:00'),
              duration: 0.1
            },
            {
              nodeId: 'condition-1',
              status: 'success',
              message: 'VIP visitor detected - approval required',
              timestamp: new Date('2025-08-13T09:30:05'),
              duration: 0.2
            },
            {
              nodeId: 'action-1',
              status: 'success',
              message: 'Approval request sent to manager',
              timestamp: new Date('2025-08-13T09:30:10'),
              duration: 2.1
            },
            {
              nodeId: 'notification-1',
              status: 'success',
              message: 'Approval notification sent to requester',
              timestamp: new Date('2025-08-13T09:32:10'),
              duration: 0.3
            }
          ],
          variables: {
            visitorName: 'John Doe',
            visitorType: 'VIP',
            requestedBy: 'receptionist@securegate.com',
            approver: 'manager@securegate.com'
          }
        },
        {
          id: 'exec-002',
          workflowId: 'wf-002',
          status: 'running',
          startedAt: new Date('2025-08-13T10:15:00'),
          triggeredBy: 'security-system',
          currentNode: 'notification-1',
          executionLog: [
            {
              nodeId: 'trigger-1',
              status: 'success',
              message: 'Security alert triggered - unauthorized access attempt',
              timestamp: new Date('2025-08-13T10:15:00'),
              duration: 0.1
            },
            {
              nodeId: 'condition-1',
              status: 'success',
              message: 'High severity incident detected',
              timestamp: new Date('2025-08-13T10:15:02'),
              duration: 0.3
            },
            {
              nodeId: 'action-1',
              status: 'success',
              message: 'Areas locked down successfully',
              timestamp: new Date('2025-08-13T10:15:05'),
              duration: 1.8
            }
          ],
          variables: {
            alertType: 'unauthorized_access',
            severity: 'high',
            location: 'Main Entrance',
            cameraId: 'CAM-001'
          }
        }
      ];

      const mockApprovalRequests: ApprovalRequest[] = [
        {
          id: 'apr-001',
          workflowExecutionId: 'exec-001',
          workflowName: 'VIP Visitor Approval',
          nodeId: 'action-1',
          requestedBy: 'receptionist@securegate.com',
          assignedTo: ['manager@securegate.com'],
          requestDate: new Date('2025-08-13T09:30:10'),
          dueDate: new Date('2025-08-14T09:30:10'),
          status: 'pending',
          priority: 'medium',
          details: 'VIP visitor John Doe requesting access for business meeting',
          comments: [
            {
              user: 'receptionist@securegate.com',
              message: 'Urgent business meeting with CEO',
              timestamp: new Date('2025-08-13T09:30:10')
            }
          ]
        },
        {
          id: 'apr-002',
          workflowExecutionId: 'exec-003',
          workflowName: 'After Hours Access',
          nodeId: 'approval-1',
          requestedBy: 'security@securegate.com',
          assignedTo: ['supervisor@securegate.com'],
          requestDate: new Date('2025-08-12T18:45:00'),
          dueDate: new Date('2025-08-13T08:00:00'),
          status: 'approved',
          priority: 'high',
          details: 'Emergency maintenance access required',
          comments: [],
          decision: {
            approver: 'supervisor@securegate.com',
            decision: 'approved',
            reason: 'Critical infrastructure maintenance',
            timestamp: new Date('2025-08-12T19:15:00')
          }
        }
      ];

      setWorkflows(mockWorkflows);
      setTemplates(workflowTemplates);
      setExecutions(mockExecutions);
      setApprovalRequests(mockApprovalRequests);

    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load workflow data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const executeWorkflow = async (workflowId: string, triggeredBy: string = 'manual') => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      toast({
        title: "Workflow Started",
        description: `Executing ${workflow.name}...`,
      });

      const newExecution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        workflowId,
        status: 'running',
        startedAt: new Date(),
        triggeredBy,
        currentNode: workflow.nodes[0]?.id,
        executionLog: [
          {
            nodeId: workflow.nodes[0]?.id || '',
            status: 'success',
            message: 'Workflow execution started',
            timestamp: new Date(),
            duration: 0.1
          }
        ],
        variables: {}
      };

      setExecutions(prev => [newExecution, ...prev]);

      // Simulate workflow execution
      setTimeout(() => {
        setExecutions(prev => prev.map(exec => 
          exec.id === newExecution.id 
            ? { 
                ...exec, 
                status: 'completed',
                completedAt: new Date(),
                executionLog: [
                  ...exec.executionLog,
                  {
                    nodeId: 'final',
                    status: 'success',
                    message: 'Workflow completed successfully',
                    timestamp: new Date(),
                    duration: Math.random() * 5 + 1
                  }
                ]
              }
            : exec
        ));

        toast({
          title: "Workflow Complete",
          description: `${workflow.name} executed successfully.`,
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute workflow.",
        variant: "destructive"
      });
    }
  };

  const toggleWorkflow = async (workflowId: string, status: 'active' | 'paused') => {
    try {
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, status } : w
      ));

      toast({
        title: status === 'active' ? "Workflow Activated" : "Workflow Paused",
        description: `Workflow has been ${status === 'active' ? 'activated' : 'paused'}.`,
      });
    } catch (error) {
      toast({
        title: "Status Change Failed",
        description: "Failed to change workflow status.",
        variant: "destructive"
      });
    }
  };

  const approveRequest = async (requestId: string, decision: 'approved' | 'rejected', reason: string) => {
    try {
      setApprovalRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: decision,
              decision: {
                approver: 'current-user@securegate.com',
                decision,
                reason,
                timestamp: new Date()
              }
            }
          : req
      ));

      toast({
        title: decision === 'approved' ? "Request Approved" : "Request Rejected",
        description: `Approval request has been ${decision}.`,
      });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to process approval request.",
        variant: "destructive"
      });
    }
  };

  const createFromTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        name: template.name,
        description: template.description,
        category: template.category,
        status: 'draft',
        version: '1.0',
        createdBy: 'current-user@securegate.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: template.nodes,
        connections: template.connections,
        triggers: [],
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0
        },
        permissions: {
          canEdit: ['admin'],
          canExecute: ['admin'],
          canView: ['admin']
        }
      };

      setWorkflows(prev => [newWorkflow, ...prev]);
      setSelectedWorkflow(newWorkflow.id);
      setDesignerMode(true);

      toast({
        title: "Workflow Created",
        description: `${template.name} workflow created from template.`,
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create workflow from template.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchWorkflowData();
  }, [fetchWorkflowData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': case 'approved': return 'bg-green-500';
      case 'running': case 'pending': return 'bg-blue-500';
      case 'paused': case 'draft': return 'bg-yellow-500';
      case 'failed': case 'rejected': case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'completed': case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'running': case 'pending': return <Clock className="h-4 w-4" />;
      case 'paused': case 'draft': return <Pause className="h-4 w-4" />;
      case 'failed': case 'rejected': case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visitor': return <Users className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      case 'maintenance': return <Settings className="h-5 w-5" />;
      case 'approval': return <UserCheck className="h-5 w-5" />;
      case 'notification': return <Bell className="h-5 w-5" />;
      default: return <Workflow className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Workflow className="h-6 w-6 animate-pulse" />
          <span>Loading workflow automation engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-8 w-8" />
            Workflow Automation Engine
          </h1>
          <p className="text-muted-foreground">
            Design, execute, and monitor automated business processes
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchWorkflowData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <Download className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button size="sm" onClick={() => setDesignerMode(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter(w => w.status === 'draft').length} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions.filter(e => e.status === 'running').length}</div>
            <p className="text-xs text-muted-foreground">
              {executions.filter(e => e.status === 'completed').length} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRequests.filter(a => a.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">
              {approvalRequests.filter(a => a.priority === 'urgent').length} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.length > 0 ? Math.round(
                workflows.reduce((acc, w) => acc + (w.statistics.successfulExecutions / Math.max(w.statistics.totalExecutions, 1)), 0) / workflows.length * 100
              ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Average across all workflows</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(workflow.category)}
                      <div>
                        <CardTitle className="text-sm">{workflow.name}</CardTitle>
                        <CardDescription className="text-xs">{workflow.category}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status)}`}></div>
                      {getStatusIcon(workflow.status)}
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">v{workflow.version}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{workflow.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Executions:</span>
                      <div className="font-medium">{workflow.statistics.totalExecutions}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <div className="font-medium">
                        {workflow.statistics.totalExecutions > 0 
                          ? Math.round((workflow.statistics.successfulExecutions / workflow.statistics.totalExecutions) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Time:</span>
                      <div className="font-medium">{workflow.statistics.averageExecutionTime}s</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <div className="font-medium">
                        {workflow.statistics.lastExecution?.toLocaleDateString() || 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {workflow.status === 'active' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleWorkflow(workflow.id, 'paused')}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleWorkflow(workflow.id, 'active')}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => executeWorkflow(workflow.id)}
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-6">
          <div className="space-y-4">
            {executions.map((execution) => {
              const workflow = workflows.find(w => w.id === execution.workflowId);
              return (
                <Card key={execution.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{workflow?.name}</CardTitle>
                        <CardDescription className="text-xs">
                          Started {execution.startedAt.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(execution.status)}`}></div>
                        <Badge variant="outline" className="text-xs capitalize">{execution.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Triggered By:</span>
                          <div className="font-medium">{execution.triggeredBy}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">
                            {execution.completedAt 
                              ? `${((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000).toFixed(1)}s`
                              : 'Running...'
                            }
                          </div>
                        </div>
                      </div>

                      {execution.currentNode && (
                        <Alert>
                          <Activity className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Currently executing: {execution.currentNode}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <div className="text-xs font-medium">Execution Log:</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {execution.executionLog.map((log, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs p-2 border rounded">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                log.status === 'success' ? 'bg-green-500' :
                                log.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="flex-1">{log.message}</span>
                              <span className="text-muted-foreground">{log.duration.toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="space-y-4">
            {approvalRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{request.workflowName}</CardTitle>
                      <CardDescription className="text-xs">
                        Requested by {request.requestedBy}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        request.priority === 'urgent' ? 'destructive' :
                        request.priority === 'high' ? 'destructive' :
                        request.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {request.priority}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(request.status)}`}></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">{request.details}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div className="font-medium">{request.dueDate.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned To:</span>
                        <div className="font-medium">{request.assignedTo.join(', ')}</div>
                      </div>
                    </div>

                    {request.decision && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {request.decision.decision === 'approved' ? 'Approved' : 'Rejected'} by {request.decision.approver}: {request.decision.reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => approveRequest(request.id, 'approved', 'Approved via workflow interface')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveRequest(request.id, 'rejected', 'Rejected via workflow interface')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <div>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={
                      template.complexity === 'basic' ? 'secondary' :
                      template.complexity === 'intermediate' ? 'default' : 'destructive'
                    }>
                      {template.complexity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{template.estimatedSetupTime}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs font-medium">Use Cases:</span>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        {template.useCases.slice(0, 2).map((useCase, index) => (
                          <li key={index}>• {useCase}</li>
                        ))}
                        {template.useCases.length > 2 && (
                          <li>• +{template.useCases.length - 2} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => createFromTemplate(template.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Execution statistics and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(workflow.category)}
                        <div>
                          <div className="font-medium text-sm">{workflow.name}</div>
                          <div className="text-xs text-muted-foreground">{workflow.statistics.totalExecutions} executions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {workflow.statistics.totalExecutions > 0 
                            ? Math.round((workflow.statistics.successfulExecutions / workflow.statistics.totalExecutions) * 100)
                            : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">{workflow.statistics.averageExecutionTime}s avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Workflow distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['visitor', 'security', 'maintenance', 'approval', 'notification'].map((category) => {
                    const count = workflows.filter(w => w.category === category).length;
                    const percentage = workflows.length > 0 ? (count / workflows.length) * 100 : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category}
                          </span>
                          <span>{count} workflows</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAutomationEngine;
