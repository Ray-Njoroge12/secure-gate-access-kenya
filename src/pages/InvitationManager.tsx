import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { UserPlus, Calendar, Clock, Share2, Eye, X, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  resident_id: string;
  visitor_full_name: string;
  visitor_email: string;
  visitor_phone_number: string;
  visit_date: string;
  visit_purpose: string | null;
  visit_duration_hours: number | null;
  invitation_token: string;
  token_expires_at: string;
  status: string;
  created_at: string;
}

export const InvitationManager: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    visitor_full_name: '',
    visitor_email: '',
    visitor_phone_number: '',
    visit_date: '',
    visit_purpose: '',
    visit_duration_hours: '',
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.listInvitations();
      if (result.error) {
        throw new Error(result.error);
      }
      setInvitations(result.data || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await apiClient.createInvitation({
        visitor_full_name: formData.visitor_full_name,
        visitor_email: formData.visitor_email,
        visitor_phone_number: formData.visitor_phone_number,
        visit_date: formData.visit_date,
        visit_purpose: formData.visit_purpose || undefined,
        visit_duration_hours: formData.visit_duration_hours ? parseInt(formData.visit_duration_hours) : undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Invitation created successfully!",
      });

      setFormData({
        visitor_full_name: '',
        visitor_email: '',
        visitor_phone_number: '',
        visit_date: '',
        visit_purpose: '',
        visit_duration_hours: '',
      });

      setIsCreateDialogOpen(false);
      loadInvitations();
    } catch (error) {
      console.error('Failed to create invitation:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.cancelInvitation(invitationId);
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Invitation cancelled successfully!",
      });

      loadInvitations();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareInvitation = (invitation: Invitation) => {
    const registrationUrl = `${window.location.origin}/visitor-registration?token=${invitation.invitation_token}`;

    if (navigator.share) {
      navigator.share({
        title: 'Visitor Invitation',
        text: `You have been invited to visit. Please register using this link: ${registrationUrl}`,
        url: registrationUrl,
      });
    } else {
      navigator.clipboard.writeText(registrationUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard!",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'used':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Used</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Visitor Invitations</h1>
          <p className="text-muted-foreground">
            Manage visitor invitations and track their status
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Visitor Invitation</DialogTitle>
              <DialogDescription>
                Create an invitation for a visitor to register and access the premises.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitor_full_name">Visitor Full Name</Label>
                <Input
                  id="visitor_full_name"
                  value={formData.visitor_full_name}
                  onChange={(e) => setFormData({ ...formData, visitor_full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitor_email">Visitor Email</Label>
                <Input
                  id="visitor_email"
                  type="email"
                  value={formData.visitor_email}
                  onChange={(e) => setFormData({ ...formData, visitor_email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitor_phone_number">Visitor Phone Number</Label>
                <Input
                  id="visitor_phone_number"
                  value={formData.visitor_phone_number}
                  onChange={(e) => setFormData({ ...formData, visitor_phone_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit_purpose">Purpose of Visit</Label>
                <Textarea
                  id="visit_purpose"
                  value={formData.visit_purpose}
                  onChange={(e) => setFormData({ ...formData, visit_purpose: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit_date">Visit Date & Time</Label>
                <Input
                  id="visit_date"
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit_duration_hours">Duration (hours)</Label>
                <Input
                  id="visit_duration_hours"
                  type="number"
                  value={formData.visit_duration_hours}
                  onChange={(e) => setFormData({ ...formData, visit_duration_hours: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            View and manage all visitor invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && invitations.length === 0 ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations found. Create your first invitation to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invitation.visitor_full_name}</div>
                        <div className="text-sm text-muted-foreground">{invitation.visitor_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{invitation.visit_purpose || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.visit_date), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(invitation)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShareInvitation(invitation)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invitation Details</DialogTitle>
            <DialogDescription>
              Detailed information about the visitor invitation
            </DialogDescription>
          </DialogHeader>
          {selectedInvitation && (
            <div className="space-y-4">
              <div>
                <Label>Visitor Name</Label>
                <p className="text-sm text-muted-foreground">{selectedInvitation.visitor_full_name}</p>
              </div>
              <div>
                <Label>Visitor Email</Label>
                <p className="text-sm text-muted-foreground">{selectedInvitation.visitor_email}</p>
              </div>
              <div>
                <Label>Visitor Phone</Label>
                <p className="text-sm text-muted-foreground">{selectedInvitation.visitor_phone_number}</p>
              </div>
              <div>
                <Label>Purpose</Label>
                <p className="text-sm text-muted-foreground">{selectedInvitation.visit_purpose || 'N/A'}</p>
              </div>
              <div>
                <Label>Visit Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedInvitation.visit_date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <Label>Duration</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedInvitation.visit_duration_hours ? `${selectedInvitation.visit_duration_hours} hours` : 'N/A'}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedInvitation.status)}</div>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedInvitation.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <Label>Expires At</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedInvitation.token_expires_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {selectedInvitation.status === 'pending' && (
                <div>
                  <Label>Invitation Token</Label>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {selectedInvitation.invitation_token}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
