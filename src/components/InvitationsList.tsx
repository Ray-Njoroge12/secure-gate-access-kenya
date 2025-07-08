import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Phone, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: string;
  visitor_full_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  visit_purpose: string;
  visit_date: string;
  visit_duration_hours: number;
  invitation_token: string;
  token_expires_at: string;
  status: string;
  created_at: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800", 
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('visit_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('visit_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled successfully"
      });
      
      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error", 
        description: "Failed to cancel invitation",
        variant: "destructive"
      });
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/visitor-registration?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Invitation link has been copied to clipboard"
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading invitations...</div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mb-2" />
          <div className="text-muted-foreground">No invitations sent yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Invitations</h3>
        <Badge variant="secondary">{invitations.length} total</Badge>
      </div>

      {invitations.map((invitation) => (
        <Card key={invitation.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{invitation.visitor_full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {invitation.visit_purpose}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                className={statusColors[invitation.status as keyof typeof statusColors]}
                variant="secondary"
              >
                {invitation.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{invitation.visitor_phone}</span>
              </div>
              
              {invitation.visitor_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{invitation.visitor_email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(invitation.visit_date), "PPP")}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{invitation.visit_duration_hours} hours</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Created {format(new Date(invitation.created_at), "PPP 'at' p")}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInvitationLink(invitation.invitation_token)}
                >
                  Copy Link
                </Button>
                
                {invitation.status === 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelInvitation(invitation.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}