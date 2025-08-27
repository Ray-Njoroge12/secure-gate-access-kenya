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
  Shield, 
  Clock, 
  User, 
  MapPin, 
  Camera, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MessageSquare,
  X
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";

// Local minimal profile shape decoupled from Supabase types
interface Profile { id?: string; user_id?: string; email?: string; role?: string; }

interface IncidentDetails {
  id: string;
  type: 'security_breach' | 'suspicious_activity' | 'emergency' | 'equipment_failure' | 'theft' | 'vandalism' | 'trespassing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';
  assignedTo?: string;
  priority: number; // 1-10 scale
  
  // Additional details
  witnesses: string[];
  involvedPersons: string[];
  evidence: {
    photos: string[];
    videos: string[];
    documents: string[];
  };
  
  // Timeline
  timeline: {
    timestamp: string;
    action: string;
    performedBy: string;
    notes?: string;
  }[];
  
  // Resolution
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  
  // Notifications
  notificationsTriggered: {
    type: 'email' | 'sms' | 'push' | 'call';
    recipient: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'failed';
  }[];
  
  // Impact assessment
  impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedAreas: string[];
  estimatedCost?: number;
  
  // Compliance and reporting
  reportToAuthorities: boolean;
  authoritiesContacted?: string[];
  complianceNotes?: string;
}

interface IncidentStats {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  averageResolutionTime: number;
  incidentsByType: { type: string; count: number }[];
  incidentsBySeverity: { severity: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

const IncidentManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [incidents, setIncidents] = useState<IncidentDetails[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    totalIncidents: 0,
    openIncidents: 0,
    criticalIncidents: 0,
    averageResolutionTime: 0,
    incidentsByType: [],
    incidentsBySeverity: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetails | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { session, loading: authLoading } = useAuthSession();

  // New incident form state
  const [newIncident, setNewIncident] = useState({
    type: 'other' as const,
    severity: 'medium' as const,
    title: '',
    description: '',
    location: '',
    witnesses: [''],
    involvedPersons: [''],
    priority: 5,
    impactLevel: 'minimal' as const,
    affectedAreas: [''],
    reportToAuthorities: false
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (authLoading) return; // wait for auth
        if (!session?.user) { navigate('/'); return; }

        const profileResponse = await apiClient.getProfile();
        const profile = profileResponse.data?.user;
        if (!profile) {
          toast({ title: 'Access Denied', description: 'Unable to verify your credentials', variant: 'destructive' });
          navigate('/');
          return;
        }
        if (profile.role && !['admin', 'guard'].includes(profile.role)) {
          toast({ title: 'Access Denied', description: 'You need admin or security privileges to access incident management', variant: 'destructive' });
          navigate('/');
          return;
        }
        setUserProfile(profile);
        await loadIncidents();
        await loadStats();
      } catch (e) {
        console.error('Initialization error:', e);
        toast({ title: 'Error', description: 'Failed to initialize incident management', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [authLoading, session, toast, navigate]);

  const loadIncidents = async () => {
    try {
      // Mock data for demonstration
      const mockIncidents: IncidentDetails[] = [
        {
          id: '1',
          type: 'suspicious_activity',
          severity: 'high',
          title: 'Unauthorized Drone Activity',
          description: 'Unknown drone spotted flying over restricted residential area, appeared to be recording',
          location: 'Block A, Residential Zone',
          reportedBy: 'Guard John Smith',
          reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'investigating',
          assignedTo: 'Security Manager Jane Doe',
          priority: 8,
          witnesses: ['Resident Mary Johnson', 'Security Guard Tom Wilson'],
          involvedPersons: ['Unknown drone operator'],
          evidence: {
            photos: ['drone_photo_1.jpg', 'drone_photo_2.jpg'],
            videos: ['drone_video_1.mp4'],
            documents: []
          },
          timeline: [
            {
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              action: 'Incident reported',
              performedBy: 'Guard John Smith',
              notes: 'Initial sighting and photo evidence collected'
            },
            {
              timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
              action: 'Investigation started',
              performedBy: 'Security Manager Jane Doe',
              notes: 'Reviewing security camera footage'
            }
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notificationsTriggered: [
            {
              type: 'email',
              recipient: 'security@company.com',
              sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: 'delivered'
            },
            {
              type: 'sms',
              recipient: '+254700123456',
              sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: 'delivered'
            }
          ],
          impactLevel: 'moderate',
          affectedAreas: ['Block A', 'Security Perimeter'],
          reportToAuthorities: true,
          authoritiesContacted: ['Local Police', 'Aviation Authority'],
          complianceNotes: 'Reported to relevant authorities as per security protocol'
        },
        {
          id: '2',
          type: 'equipment_failure',
          severity: 'medium',
          title: 'Gate Access System Malfunction',
          description: 'Main gate access control system intermittently failing to read access cards',
          location: 'Main Gate',
          reportedBy: 'Gate Operator Alice Brown',
          reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'open',
          priority: 6,
          witnesses: [],
          involvedPersons: [],
          evidence: {
            photos: ['gate_system_error.jpg'],
            videos: [],
            documents: ['error_log.txt']
          },
          timeline: [
            {
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              action: 'Equipment failure reported',
              performedBy: 'Gate Operator Alice Brown',
              notes: 'Multiple access card failures observed'
            }
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          notificationsTriggered: [
            {
              type: 'email',
              recipient: 'maintenance@company.com',
              sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              status: 'delivered'
            }
          ],
          impactLevel: 'moderate',
          affectedAreas: ['Main Gate', 'Access Control System'],
          reportToAuthorities: false
        }
      ];

      setIncidents(mockIncidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats calculation
      const mockStats: IncidentStats = {
        totalIncidents: 45,
        openIncidents: 12,
        criticalIncidents: 3,
        averageResolutionTime: 4.5, // hours
        incidentsByType: [
          { type: 'Suspicious Activity', count: 15 },
          { type: 'Equipment Failure', count: 12 },
          { type: 'Security Breach', count: 8 },
          { type: 'Emergency', count: 5 },
          { type: 'Other', count: 5 }
        ],
        incidentsBySeverity: [
          { severity: 'Critical', count: 3 },
          { severity: 'High', count: 8 },
          { severity: 'Medium', count: 22 },
          { severity: 'Low', count: 12 }
        ],
        monthlyTrend: [
          { month: 'Jan', count: 8 },
          { month: 'Feb', count: 12 },
          { month: 'Mar', count: 15 },
          { month: 'Apr', count: 10 }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createIncident = async () => {
    if (!newIncident.title || !newIncident.description || !newIncident.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Allow severity comparisons by reading current value (assert as any to satisfy TS after narrowing)
    const currentSeverity = newIncident.severity as string;
    const incident: IncidentDetails = {
      id: Date.now().toString(),
      ...newIncident,
      reportedBy: userProfile?.email || 'Unknown',
      reportedAt: new Date().toISOString(),
      status: 'open',
      witnesses: newIncident.witnesses.filter(w => w.trim()),
      involvedPersons: newIncident.involvedPersons.filter(p => p.trim()),
      evidence: { photos: [], videos: [], documents: [] },
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'Incident created',
        performedBy: userProfile?.email || 'Unknown',
        notes: 'Initial incident report'
      }],
      followUpRequired: currentSeverity === 'high' || currentSeverity === 'critical',
      followUpDate: currentSeverity === 'critical' ? 
        new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : // 2 hours for critical
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours for others
      notificationsTriggered: [],
      affectedAreas: newIncident.affectedAreas.filter(a => a.trim())
    };

    setIncidents(prev => [incident, ...prev]);
    
    // Reset form
    setNewIncident({
      type: 'other',
      severity: 'medium',
      title: '',
      description: '',
      location: '',
      witnesses: [''],
      involvedPersons: [''],
      priority: 5,
      impactLevel: 'minimal',
      affectedAreas: [''],
      reportToAuthorities: false
    });
    setShowCreateForm(false);

    toast({
      title: "Success",
      description: "Incident created successfully",
    });

    // Trigger notifications based on severity
    await triggerIncidentNotifications(incident);
  };

  const triggerIncidentNotifications = async (incident: IncidentDetails) => {
    // Mock notification triggering
    const notifications = [];

    if (incident.severity === 'critical' || incident.severity === 'high') {
      notifications.push({
        type: 'email' as const,
        recipient: 'security@company.com',
        sentAt: new Date().toISOString(),
        status: 'sent' as const
      });
      notifications.push({
        type: 'sms' as const,
        recipient: '+254700123456',
        sentAt: new Date().toISOString(),
        status: 'sent' as const
      });
    }

    if (incident.severity === 'critical') {
      notifications.push({
        type: 'call' as const,
        recipient: 'Emergency Response Team',
        sentAt: new Date().toISOString(),
        status: 'sent' as const
      });
    }

    // Update incident with notification records
    setIncidents(prev => 
      prev.map(i => 
        i.id === incident.id 
          ? { ...i, notificationsTriggered: notifications }
          : i
      )
    );

    toast({
      title: "Notifications Sent",
      description: `${notifications.length} notification(s) triggered for this incident`,
    });
  };

  const updateIncidentStatus = async (incidentId: string, status: IncidentDetails['status']) => {
    const timelineEntry = {
      timestamp: new Date().toISOString(),
      action: `Status changed to ${status}`,
      performedBy: userProfile?.email || 'Unknown'
    };

    setIncidents(prev => 
      prev.map(i => 
        i.id === incidentId 
          ? { 
              ...i, 
              status,
              timeline: [...i.timeline, timelineEntry],
              resolvedAt: status === 'resolved' ? new Date().toISOString() : i.resolvedAt,
              resolvedBy: status === 'resolved' ? userProfile?.email : i.resolvedBy
            }
          : i
      )
    );

    toast({
      title: "Status Updated",
      description: `Incident status changed to ${status}`,
    });
  };

  const addTimelineEntry = (incidentId: string, action: string, notes?: string) => {
    const timelineEntry = {
      timestamp: new Date().toISOString(),
      action,
      performedBy: userProfile?.email || 'Unknown',
      notes
    };

    setIncidents(prev => 
      prev.map(i => 
        i.id === incidentId 
          ? { ...i, timeline: [...i.timeline, timelineEntry] }
          : i
      )
    );
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesSearch = !searchTerm || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading incident management...</p>
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
            <Shield className="h-8 w-8 text-red-600" />
            Incident Management
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive incident tracking and management system
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold">{stats.totalIncidents}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.openIncidents}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Incidents</p>
                  <p className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Resolution</p>
                  <p className="text-2xl font-bold text-green-600">{stats.averageResolutionTime}h</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="ml-auto"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>

        {/* Create Incident Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Incident Report</CardTitle>
              <CardDescription>
                Provide detailed information about the incident
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Incident Type *</label>
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
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="trespassing">Trespassing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Severity *</label>
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
                <div>
                  <label className="block text-sm font-medium mb-2">Priority (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newIncident.priority}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the incident"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <Input
                  value={newIncident.location}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where did this incident occur?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what happened"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Impact Level</label>
                  <Select value={newIncident.impactLevel} onValueChange={(value: any) => 
                    setNewIncident(prev => ({ ...prev, impactLevel: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="significant">Significant</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="reportAuthorities"
                    checked={newIncident.reportToAuthorities}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, reportToAuthorities: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="reportAuthorities" className="text-sm font-medium">
                    Report to Authorities
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={createIncident}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Incident
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No incidents found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredIncidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{incident.title}</h3>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            Priority: {incident.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{incident.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
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
                          <SelectItem value="escalated">Escalated</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {incident.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {incident.reportedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(incident.reportedAt).toLocaleString()}
                    </span>
                    {incident.assignedTo && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Assigned: {incident.assignedTo}
                      </span>
                    )}
                  </div>

                  {incident.followUpRequired && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Follow-up Required</AlertTitle>
                      <AlertDescription>
                        Follow-up scheduled for {new Date(incident.followUpDate!).toLocaleString()}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Incident Details Modal/Panel would go here */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Incident Details</h2>
                  <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Detailed incident view would be implemented here */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Title:</strong> {selectedIncident.title}</p>
                        <p><strong>Type:</strong> {selectedIncident.type}</p>
                        <p><strong>Severity:</strong> {selectedIncident.severity}</p>
                        <p><strong>Status:</strong> {selectedIncident.status}</p>
                        <p><strong>Priority:</strong> {selectedIncident.priority}/10</p>
                        <p><strong>Location:</strong> {selectedIncident.location}</p>
                        <p><strong>Impact Level:</strong> {selectedIncident.impactLevel}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Reporting Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Reported By:</strong> {selectedIncident.reportedBy}</p>
                        <p><strong>Reported At:</strong> {new Date(selectedIncident.reportedAt).toLocaleString()}</p>
                        {selectedIncident.assignedTo && (
                          <p><strong>Assigned To:</strong> {selectedIncident.assignedTo}</p>
                        )}
                        {selectedIncident.resolvedBy && (
                          <p><strong>Resolved By:</strong> {selectedIncident.resolvedBy}</p>
                        )}
                        {selectedIncident.resolvedAt && (
                          <p><strong>Resolved At:</strong> {new Date(selectedIncident.resolvedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-gray-600">{selectedIncident.description}</p>
                  </div>
                  
                  {selectedIncident.witnesses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Witnesses</h3>
                      <ul className="text-sm text-gray-600">
                        {selectedIncident.witnesses.map((witness, index) => (
                          <li key={index}>• {witness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <div className="space-y-2">
                      {selectedIncident.timeline.map((entry, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4 pb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{entry.action}</span>
                            <span className="text-gray-500">
                              - {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">By: {entry.performedBy}</p>
                          {entry.notes && (
                            <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedIncident.notificationsTriggered.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Notifications Sent</h3>
                      <div className="space-y-1">
                        {selectedIncident.notificationsTriggered.map((notification, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {notification.type === 'email' && <Mail className="h-4 w-4" />}
                            {notification.type === 'sms' && <Phone className="h-4 w-4" />}
                            {notification.type === 'push' && <MessageSquare className="h-4 w-4" />}
                            {notification.type === 'call' && <Phone className="h-4 w-4" />}
                            <span>{notification.type.toUpperCase()} to {notification.recipient}</span>
                            <Badge variant={notification.status === 'delivered' ? 'default' : 'destructive'}>
                              {notification.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentManagement;
