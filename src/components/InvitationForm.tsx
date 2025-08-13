import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createInvitationDirect } from "@/lib/visitor-flow-direct";
import { Send, UserPlus, CheckCircle, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InvitationForm() {
  const [visitorFullName, setVisitorFullName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhoneNumber, setVisitorPhoneNumber] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("Social Visit");
  const [visitDuration, setVisitDuration] = useState(2);
  const [isMultiUse, setIsMultiUse] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState<{
    invitationId: string;
    token: string;
    registrationUrl: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInvitationSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to send invitations.");
      }

      // Use direct database approach
      const result = await createInvitationDirect({
        resident_id: user.id,
        visitor_full_name: visitorFullName,
        visitor_email: visitorEmail,
        visitor_phone_number: visitorPhoneNumber,
        visit_date: visitDate,
        visit_purpose: visitPurpose,
        visit_duration_hours: visitDuration,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create invitation");
      }

      // Generate registration URL
      const baseUrl = window.location.origin;
      const registrationUrl = `${baseUrl}/visitor-registration?token=${result.token}`;

      setInvitationSuccess({
        invitationId: result.invitationId!,
        token: result.token!,
        registrationUrl,
      });

      toast({
        title: "Invitation Created Successfully!",
        description: `Invitation created for ${visitorFullName}. Share the registration link with them.`,
      });

      // Reset form
      setVisitorFullName("");
      setVisitorEmail("");
      setVisitorPhoneNumber("");
      setVisitDate("");
      setVisitPurpose("Social Visit");
      setVisitDuration(2);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Registration link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleNewInvitation = () => {
    setInvitationSuccess(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Invite a Visitor</CardTitle>
            <CardDescription>
              Create a secure registration link for your visitor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {invitationSuccess ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Invitation created successfully! Share this registration link with your visitor.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="registrationUrl">Registration Link</Label>
              <div className="flex gap-2">
                <Input
                  id="registrationUrl"
                  value={invitationSuccess.registrationUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(invitationSuccess.registrationUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Invitation ID:</strong> {invitationSuccess.invitationId}</p>
              <p><strong>Token:</strong> {invitationSuccess.token.substring(0, 20)}...</p>
            </div>

            <Button 
              onClick={handleNewInvitation}
              className="w-full"
              variant="outline"
            >
              Create Another Invitation
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="visitorFullName">Visitor's Full Name</Label>
              <Input
                id="visitorFullName"
                type="text"
                placeholder="John Doe"
                value={visitorFullName}
                onChange={(e) => setVisitorFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitorEmail">Visitor's Email Address</Label>
              <Input
                id="visitorEmail"
                type="email"
                placeholder="visitor@example.com"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitorPhoneNumber">Visitor's Phone Number</Label>
              <Input
                id="visitorPhoneNumber"
                type="tel"
                placeholder="+2547XXXXXXXX"
                value={visitorPhoneNumber}
                onChange={(e) => setVisitorPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitDate">Expected Visit Date</Label>
              <Input
                id="visitDate"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required={!isMultiUse}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitPurpose">Visit Purpose</Label>
                <Input
                  id="visitPurpose"
                  type="text"
                  placeholder="Social Visit"
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitDuration">Duration (hours)</Label>
                <Input
                  id="visitDuration"
                  type="number"
                  min="1"
                  max="24"
                  value={visitDuration}
                  onChange={(e) => setVisitDuration(parseInt(e.target.value) || 2)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMultiUse"
                checked={isMultiUse}
                onCheckedChange={(checked) => {
                  setIsMultiUse(checked as boolean);
                  if (!checked) {
                    setUsesRemaining(1);
                    setStartDate("");
                    setEndDate("");
                  }
                }}
              />
              <Label htmlFor="isMultiUse">Multi-Use Invitation (Coming Soon)</Label>
            </div>

            {isMultiUse && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usesRemaining">Uses Remaining</Label>
                  <Input
                    id="usesRemaining"
                    type="number"
                    min="1"
                    value={usesRemaining}
                    onChange={(e) => setUsesRemaining(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Creating Invitation..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Invitation
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}