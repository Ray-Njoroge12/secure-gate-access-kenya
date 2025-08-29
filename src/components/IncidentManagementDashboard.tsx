import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/hooks/use-session';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  location: string;
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  assigned_to?: string;
  evidence_count: number;
  priority_score: number;
}

interface IncidentEvidence {
  id: string;
  incident_id: string;
  evidence_type: 'photo' | 'video' | 'document' | 'log' | 'witness_statement';
  file_name: string;
  file_url: string;
  description: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface IncidentStats {
  total_incidents: number;
  active_incidents: number;
  resolved_today: number;
  critical_incidents: number;
  average_resolution_time: number;
}

export function IncidentManagementDashboard() {
  const { session } = useSession();
  const { toast } = useToast();

  // State management
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [incidentEvidence, setIncidentEvidence] = useState<IncidentEvidence[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Form state for creating incidents
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    severity: 'medium' as const,
    title: '',
    description: '',
    location: ''
  });

  // Fetch incidents and stats
  const fetchIncidents = useCallback(async () => {
    try {
      const [incidentsResponse, statsResponse] = await Promise.all([
        apiClient.get('/incidents', {
          params: {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            severity: severityFilter !== 'all' ? severityFilter : undefined
          }
        }),
        apiClient.get('/incidents/stats')
      ]);

      setIncidents(incidentsResponse.data.incidents || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incident data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, severityFilter, toast]);

  // Create new incident
  const createIncident = useCallback(async () => {
    if (!newIncident.title || !newIncident.description || !newIncident.incident_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreatingIncident(true);
    try {
      const response = await apiClient.post('/incidents', {
        ...newIncident,
        reported_by: session?.user?.id
      });

      setIncidents(prev => [response.data, ...prev]);
      setNewIncident({
        incident_type: '',
        severity: 'medium',
        title: '',
        description: '',
        location: ''
      });
      setShowCreateDialog(false);

      toast({
        title: "Incident Created",
        description: "Security incident has been reported successfully",
      });

      // Refresh stats
      fetchIncidents();
    } catch (error) {
      console.error('Failed to create incident:', error);
      toast({
        title: "Error",
        description: "Failed to create incident",
        variant: "destructive",
      });
    } finally {
      setCreatingIncident(false);
    }
  }, [newIncident, session?.user?.id, toast, fetchIncidents]);

  // Update incident status
  const updateIncidentStatus = useCallback(async (incidentId: string, newStatus: string) => {
    setUpdatingStatus(incidentId);
    try {
      const response = await apiClient.patch(`/incidents/${incidentId}/status`, {
        status: newStatus,
        updated_by: session?.user?.id
      });

      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId ? response.data : incident
      ));

      toast({
        title: "Status Updated",
        description: `Incident status changed to ${newStatus}`,
      });

      // Refresh stats
      fetchIncidents();
    } catch (error) {
      console.error('Failed to update incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  }, [session?.user?.id, toast, fetchIncidents]);

  // Fetch incident evidence
  const fetchIncidentEvidence = useCallback(async (incidentId: string) => {
    try {
      const response = await apiClient.get(`/incidents/${incidentId}/evidence`);
      setIncidentEvidence(response.data.evidence || []);
    } catch (error) {
      console.error('Failed to fetch incident evidence:', error);
      toast({
        title: "Error",
        description: "Failed to load incident evidence",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle incident selection
  const handleIncidentSelect = useCallback((incident: SecurityIncident) => {
    setSelectedIncident(incident);
    fetchIncidentEvidence(incident.id);
    setShowEvidenceDialog(true);
  }, [fetchIncidentEvidence]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get incident type icon
  const getIncidentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security_breach': return <AlertTriangle className="w-4 h-4" />;
      case 'unauthorized_access': return <XCircle className="w-4 h-4" />;
      case 'suspicious_activity': return <Eye className="w-4 h-4" />;
      case 'equipment_failure': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading incident data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incident Management</h2>
          <p className="text-muted-foreground">
            Track and manage security incidents with evidence collection
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report Security Incident</DialogTitle>
              <DialogDescription>
                Create a new security incident report with details and evidence
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Incident Type</label>
                <Select
                  value={newIncident.incident_type}
                  onValueChange={(value) => setNewIncident(prev => ({ ...prev, incident_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_breach">Security Breach</SelectItem>
                    <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                    <SelectItem value="visitor_incident">Visitor Incident</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, severity: value }))}
                >
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
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief incident title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newIncident.location}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Incident location"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the incident"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={createIncident}
                  disabled={creatingIncident}
                  className="flex-1"
                >
                  {creatingIncident ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Incident
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={creatingIncident}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_incidents}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_incidents}</div>
              <p className="text-xs text-muted-foreground">Under investigation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved_today}</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical_incidents}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Incidents</CardTitle>
          <CardDescription>
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No incidents found</p>
              <p className="text-sm">Create your first incident report above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getIncidentTypeIcon(incident.incident_type)}
                        <h3 className="font-medium">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {incident.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.reported_by}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(incident.reported_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {incident.evidence_count} evidence files
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIncidentSelect(incident)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {incident.status !== 'resolved' && incident.status !== 'closed' && (
                        <div className="flex gap-1">
                          {incident.status === 'reported' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                              disabled={updatingStatus === incident.id}
                            >
                              {updatingStatus === incident.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Start Investigation'
                              )}
                            </Button>
                          )}

                          {incident.status === 'investigating' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                              disabled={updatingStatus === incident.id}
                            >
                              {updatingStatus === incident.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Mark Resolved'
                              )}
                            </Button>
                          )}
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

      {/* Incident Details Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
            <DialogDescription>
              {selectedIncident?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Incident Type</label>
                  <p className="text-sm text-muted-foreground">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Badge className={getSeverityColor(selectedIncident.severity)}>
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedIncident.status)}>
                    {selectedIncident.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="text-sm text-muted-foreground">{selectedIncident.location}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Reported By</label>
                <p className="text-sm text-muted-foreground">{selectedIncident.reported_by}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Reported At</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedIncident.reported_at).toLocaleString()}
                </p>
              </div>

              {selectedIncident.resolved_at && (
                <div>
                  <label className="text-sm font-medium">Resolved At</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedIncident.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Evidence Section */}
              <div>
                <label className="text-sm font-medium">Evidence Files ({incidentEvidence.length})</label>
                {incidentEvidence.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence files uploaded</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {incidentEvidence.map((evidence) => (
                      <div key={evidence.id} className="flex items-center gap-3 p-2 border rounded">
                        <FileText className="w-4 h-4" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{evidence.file_name}</p>
                          <p className="text-xs text-muted-foreground">{evidence.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
