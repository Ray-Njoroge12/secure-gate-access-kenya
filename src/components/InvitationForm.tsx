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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, UserPlus } from "lucide-react";

export function InvitationForm() {
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitDate, setVisitDate] = useState(""); // New state for visit date
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to send invitations.");
      }

      const { error } = await supabase.functions.invoke("create-invitation", {
        body: {
          resident_id: user.id,
          visitor_email: visitorEmail,
          visit_date: visitDate,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invitation Sent!",
        description: `An invitation has been sent to ${visitorEmail}.`,
      });
      setVisitorEmail("");
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Invite a Visitor</CardTitle>
            <CardDescription>
              Enter the visitor's email to send them a secure registration
              link.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="visitDate">Expected Visit Date</Label>
            <Input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Sending..."
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