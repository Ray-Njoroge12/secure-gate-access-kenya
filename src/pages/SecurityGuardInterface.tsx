import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Scan, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin,
  AlertTriangle,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AccessCodeData {
  id: string;
  qr_token: string;
  pin_hash: string;
  expires_at: string;
  used_at: string | null;
  visitor_id: string;
  invitation_id: string;
  visit_invitations: {
    visitor_full_name: string;
    visitor_phone: string;
    visit_purpose: string;
    visit_date: string;
    visit_duration_hours: number;
  };
  visitors: {
    full_name_encrypted: string;
    id_number_hash: string;
  };
}

interface ValidationResult {
  valid: boolean;
  message: string;
  data?: AccessCodeData;
  status: 'success' | 'error' | 'warning';
}

const SecurityGuardInterface = () => {
  const [qrToken, setQrToken] = useState("");
  const [pin, setPin] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [recentAccess, setRecentAccess] = useState<AccessCodeData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentAccess();
  }, []);

  const fetchRecentAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select(`
          *,
          visit_invitations (
            visitor_full_name,
            visitor_phone,
            visit_purpose,
            visit_date,
            visit_duration_hours
          ),
          visitors (
            full_name_encrypted,
            id_number_hash
          )
        `)
        .not('used_at', 'is', null)
        .order('used_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentAccess(data || []);
    } catch (error) {
      console.error('Error fetching recent access:', error);
    }
  };

  const validateAccess = async () => {
    if (!qrToken.trim()) {
      toast({
        title: "Missing QR Token",
        description: "Please scan or enter a QR token.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      // Fetch access code with related data
      const { data, error } = await supabase
        .from('access_codes')
        .select(`
          *,
          visit_invitations (
            visitor_full_name,
            visitor_phone,
            visit_purpose,
            visit_date,
            visit_duration_hours
          ),
          visitors (
            full_name_encrypted,
            id_number_hash
          )
        `)
        .eq('qr_token', qrToken.trim())
        .single();

      if (error || !data) {
        setLastValidation({
          valid: false,
          message: "Invalid QR code. Access denied.",
          status: 'error'
        });
        toast({
          title: "Access Denied",
          description: "Invalid QR code",
          variant: "destructive"
        });
        return;
      }

      // Check if already used
      if (data.used_at) {
        setLastValidation({
          valid: false,
          message: `QR code already used on ${format(new Date(data.used_at), "PPP 'at' p")}`,
          status: 'error',
          data
        });
        toast({
          title: "Access Denied",
          description: "QR code has already been used",
          variant: "destructive"
        });
        return;
      }

      // Check if expired
      if (new Date() > new Date(data.expires_at)) {
        setLastValidation({
          valid: false,
          message: "QR code has expired. Access denied.",
          status: 'error',
          data
        });
        toast({
          title: "Access Denied",
          description: "QR code has expired",
          variant: "destructive"
        });
        return;
      }

      // Check PIN if provided
      if (pin && pin !== data.pin_hash) {
        setLastValidation({
          valid: false,
          message: "Incorrect PIN. Access denied.",
          status: 'error',
          data
        });
        toast({
          title: "Access Denied",
          description: "Incorrect PIN",
          variant: "destructive"
        });
        return;
      }

      // Mark as used
      await supabase
        .from('access_codes')
        .update({ 
          used_at: new Date().toISOString(),
          ip_address: '127.0.0.1', // In production, get actual IP
          user_agent: navigator.userAgent
        })
        .eq('id', data.id);

      setLastValidation({
        valid: true,
        message: "Access granted. Welcome!",
        status: 'success',
        data
      });

      toast({
        title: "Access Granted",
        description: `Welcome ${data.visit_invitations?.visitor_full_name}!`
      });

      // Refresh recent access list
      fetchRecentAccess();
      
      // Clear form
      setQrToken("");
      setPin("");

    } catch (error) {
      console.error('Error validating access:', error);
      setLastValidation({
        valid: false,
        message: "System error. Please try again.",
        status: 'error'
      });
      toast({
        title: "System Error",
        description: "Failed to validate access. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Security Guard Interface</CardTitle>
                <CardDescription>
                  Scan visitor QR codes for gate access validation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                QR Code Validation
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrToken">QR Token</Label>
                <Input
                  id="qrToken"
                  placeholder="Scan or enter QR token"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN (Optional)</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={4}
                />
              </div>

              <Button 
                onClick={validateAccess}
                disabled={isValidating || !qrToken.trim()}
                className="w-full"
                size="lg"
              >
                {isValidating ? (
                  "Validating..."
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Validate Access
                  </>
                )}
              </Button>

              {/* Validation Result */}
              {lastValidation && (
                <Alert className={`mt-4 ${
                  lastValidation.status === 'success' ? 'border-green-200 bg-green-50' :
                  lastValidation.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  {lastValidation.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : lastValidation.status === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertDescription className={
                    lastValidation.status === 'success' ? 'text-green-700' :
                    lastValidation.status === 'error' ? 'text-red-700' :
                    'text-yellow-700'
                  }>
                    {lastValidation.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Visitor Details */}
              {lastValidation?.data && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Visitor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {lastValidation.data.visit_invitations?.visitor_full_name}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>{" "}
                        {lastValidation.data.visit_invitations?.visitor_phone}
                      </div>
                      <div>
                        <span className="font-medium">Purpose:</span>{" "}
                        {lastValidation.data.visit_invitations?.visit_purpose}
                      </div>
                      <div>
                        <span className="font-medium">Visit Date:</span>{" "}
                        {format(new Date(lastValidation.data.visit_invitations?.visit_date || ''), "PPP")}
                      </div>
                      <div>
                        <span className="font-medium">ID Hash:</span>{" "}
                        <span className="font-mono text-xs">
                          {lastValidation.data.visitors?.id_number_hash}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Recent Access Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Access Log
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {recentAccess.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent access records</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentAccess.map((access) => (
                    <div 
                      key={access.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {access.visit_invitations?.visitor_full_name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {access.visit_invitations?.visit_purpose}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(access.used_at!), "MMM d, p")}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Granted
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityGuardInterface;