import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Upload, QrCode, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvitationData {
  id: string;
  visitor_full_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  visit_purpose: string;
  visit_date: string;
  visit_duration_hours: number;
  resident_id: string;
}

const VisitorRegistration = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    idNumber: "",
    photoFile: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('visit_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .gt('token_expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Token",
          description: "The invitation token is invalid or has expired.",
          variant: "destructive"
        });
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation token.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      setFormData({ ...formData, photoFile: file });
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !formData.idNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      // Create visitor record with encryption placeholder  
      const { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .insert({
          full_name_encrypted: invitation.visitor_full_name,
          phone_encrypted: invitation.visitor_phone,
          email_encrypted: invitation.visitor_email,
          id_number_encrypted: formData.idNumber,
          id_number_hash: formData.idNumber, // In production, this should be properly hashed
          gdpr_consent: true
        })
        .select()
        .single();

      if (visitorError) throw visitorError;

      // Generate access code
      const qrToken = crypto.randomUUID();
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + invitation.visit_duration_hours);

      const { error: accessError } = await supabase
        .from('access_codes')
        .insert({
          invitation_id: invitation.id,
          visitor_id: visitor.id,
          resident_id: invitation.resident_id,
          qr_token: qrToken,
          pin_hash: pin, // In production, this should be properly hashed
          expires_at: expiresAt.toISOString()
        });

      if (accessError) throw accessError;

      // Update invitation status
      await supabase
        .from('visit_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      setQrCode(qrToken);
      setIsRegistered(true);
      
      toast({
        title: "Registration Successful!",
        description: "Your visitor access has been generated."
      });

    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegistered && qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Your visitor access has been generated. Show this QR code at the gate.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted rounded-lg">
              <QrCode className="h-24 w-24 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">QR Code Token:</p>
              <p className="font-mono text-sm bg-background p-2 rounded border">
                {qrCode}
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Visitor:</strong> {invitation?.visitor_full_name}</p>
              <p><strong>Purpose:</strong> {invitation?.visit_purpose}</p>
              <p><strong>Valid Until:</strong> {new Date(invitation?.visit_date || '').toLocaleDateString()}</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Save this QR code or take a screenshot. You'll need it for gate access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Visitor Registration</CardTitle>
              <CardDescription>
                Complete your registration to receive gate access
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!invitation ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="token">Invitation Token</Label>
                <Input
                  id="token"
                  placeholder="Enter your invitation token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <Button 
                onClick={validateToken} 
                disabled={!token || isValidating}
                className="w-full"
              >
                {isValidating ? "Validating..." : "Validate Token"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegistration} className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Token validated! Please complete your registration below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Visitor Name</p>
                  <p className="text-muted-foreground">{invitation.visitor_full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Visit Purpose</p>
                  <p className="text-muted-foreground">{invitation.visit_purpose}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Visit Date</p>
                  <p className="text-muted-foreground">{new Date(invitation.visit_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-muted-foreground">{invitation.visit_duration_hours} hours</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input
                  id="idNumber"
                  placeholder="Enter your national ID number"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">ID Photo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {formData.photoFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Uploaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of your ID (max 5MB)
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRegistering}
              >
                {isRegistering ? (
                  "Generating Access..."
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorRegistration;