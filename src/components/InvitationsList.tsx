import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, User, QrCode } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

interface Invitation {
  id: string;
  status: string;
  created_at: string;
  visit_date: string;
  visitors: {
    full_name: string;
    id_number: string;
    phone_number: string;
  } | null;
  access_codes: { qr_token: string }[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
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
      const { data, error } = await supabase.functions.invoke("get-resident-invitations");

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("visit_invitations")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled successfully",
      });

      fetchInvitations();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
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
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{invitation.visitors?.full_name || "Pending Registration"}</CardTitle>
                <CardDescription>
                  Invited on {format(new Date(invitation.created_at), "PPP")}
                </CardDescription>
              </div>
              <Badge className={statusColors[invitation.status as keyof typeof statusColors]}>
                {invitation.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(invitation.visit_date), "PPP")}</span>
              </div>
              {invitation.status === "accepted" && invitation.access_codes && invitation.access_codes.length > 0 && (
                <div className="p-2 bg-white rounded-lg">
                  <QRCode value={invitation.access_codes[0].qr_token} size={64} />
                </div>
              )}
            </div>
            {invitation.status === "pending" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelInvitation(invitation.id)}
              >
                Cancel Invitation
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
