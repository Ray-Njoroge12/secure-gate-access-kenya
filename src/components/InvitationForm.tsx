import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Send, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvitationFormData {
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  visitPurpose: string;
  visitDate: Date | undefined;
  visitDuration: string;
}

const visitPurposes = [
  "Family Visit",
  "Business Meeting", 
  "Delivery",
  "Maintenance",
  "Social Visit",
  "Other"
];

const visitDurations = [
  { label: "2 hours", value: "2" },
  { label: "4 hours", value: "4" },
  { label: "8 hours", value: "8" },
  { label: "1 day", value: "24" },
  { label: "2 days", value: "48" }
];

export function InvitationForm() {
  const [formData, setFormData] = useState<InvitationFormData>({
    visitorName: "",
    visitorPhone: "",
    visitorEmail: "",
    visitPurpose: "",
    visitDate: undefined,
    visitDuration: "4"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitDate) {
      toast({
        title: "Error",
        description: "Please select a visit date",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate unique invitation token
      const invitationToken = crypto.randomUUID();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 48); // 48 hours expiry

      // Get sample resident ID for now (will be replaced with auth later)
      const { data: residents } = await supabase
        .from('residents')
        .select('id')
        .limit(1);

      if (!residents || residents.length === 0) {
        throw new Error('No resident found');
      }

      const { error } = await supabase
        .from('visit_invitations')
        .insert({
          resident_id: residents[0].id,
          visitor_full_name: formData.visitorName,
          visitor_phone: formData.visitorPhone,
          visitor_email: formData.visitorEmail || null,
          visit_purpose: formData.visitPurpose,
          visit_date: formData.visitDate.toISOString(),
          visit_duration_hours: parseInt(formData.visitDuration),
          invitation_token: invitationToken,
          token_expires_at: tokenExpiresAt.toISOString()
        });

      if (error) throw error;

      // Send email notification if requested and email provided
      if (sendEmail && formData.visitorEmail) {
        try {
          const registrationUrl = `${window.location.origin}/visitor-registration`;
          
          const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
            body: {
              visitorName: formData.visitorName,
              visitorEmail: formData.visitorEmail,
              residentName: 'Resident Name', // TODO: Get from authenticated user
              residentUnit: 'Unit Number', // TODO: Get from authenticated user
              visitDate: formData.visitDate.toISOString(),
              visitPurpose: formData.visitPurpose,
              invitationToken: invitationToken,
              registrationUrl: registrationUrl
            }
          });

          if (emailError) {
            console.error('Email sending failed:', emailError);
            toast({
              title: "Invitation Created",
              description: `Invitation created but email failed. Token: ${invitationToken}`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Invitation Sent!",
              description: `Invitation email sent to ${formData.visitorName}`,
            });
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          toast({
            title: "Invitation Created", 
            description: `Invitation created. Share this token: ${invitationToken}`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invitation Created!",
          description: `Share this token with ${formData.visitorName}: ${invitationToken}`,
        });
      }

      // Reset form
      setFormData({
        visitorName: "",
        visitorPhone: "",
        visitorEmail: "",
        visitPurpose: "",
        visitDate: undefined,
        visitDuration: "4"
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Invite a Visitor</CardTitle>
            <CardDescription>
              Send an invitation to your guest for secure access to the community
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitorName">Visitor Full Name *</Label>
              <Input
                id="visitorName"
                placeholder="John Doe"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visitorPhone">Phone Number *</Label>
              <Input
                id="visitorPhone"
                placeholder="+254700000000"
                value={formData.visitorPhone}
                onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitorEmail">Email Address (Optional)</Label>
            <Input
              id="visitorEmail"
              type="email"
              placeholder="john@example.com"
              value={formData.visitorEmail}
              onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visit Purpose *</Label>
              <Select
                value={formData.visitPurpose}
                onValueChange={(value) => setFormData({ ...formData, visitPurpose: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {visitPurposes.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visit Duration</Label>
              <Select
                value={formData.visitDuration}
                onValueChange={(value) => setFormData({ ...formData, visitDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visitDurations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visit Date & Time *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.visitDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.visitDate ? format(formData.visitDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.visitDate}
                  onSelect={(date) => setFormData({ ...formData, visitDate: date })}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-input"
                disabled={!formData.visitorEmail}
              />
              <Label htmlFor="sendEmail" className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send invitation email to visitor
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {!formData.visitorEmail 
                ? "Email address required to send invitation email" 
                : "If unchecked, you'll need to share the invitation token manually"
              }
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              "Sending Invitation..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}