import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, 
  KeyRound, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Phone,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { QRCodeScanner } from "./QRCodeScanner";
import { PINEntry } from "./PINEntry";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantProvider";

interface AccessVerificationSystemProps {
  onAccessGranted?: (accessData: AccessData) => void;
  onAccessDenied?: (reason: string) => void;
}

interface AccessData {
  visitorName: string;
  residentName: string;
  unitNumber: string;
  accessMethod: 'qr' | 'pin';
  timestamp: Date;
  validUntil: Date;
  phoneNumber?: string;
  emergencyContact?: string;
}

export function AccessVerificationSystem({ 
  onAccessGranted, 
  onAccessDenied 
}: AccessVerificationSystemProps) {
  const { activeCommunityId } = useTenant();
  const [activeTab, setActiveTab] = useState<'qr' | 'pin'>('qr');
  const [lastAccessData, setLastAccessData] = useState<AccessData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentAccess, setRecentAccess] = useState<AccessData[]>([]);
  const { toast } = useToast();

  // Load recent access logs
  useEffect(() => {
    loadRecentAccess();
  }, [activeCommunityId]);

  const loadRecentAccess = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('access_logs')
        .select(`
          *,
          access_codes (
            visitors (full_name, phone_number),
            visit_invitations (
              residents (full_name, unit_number)
            )
          )
        `)
        .eq('community_id', activeCommunityId as string)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedData = data?.map(log => ({
        visitorName: log.access_codes?.visitors?.full_name || 'Unknown',
        residentName: log.access_codes?.visit_invitations?.residents?.full_name || 'Unknown',
        unitNumber: log.access_codes?.visit_invitations?.residents?.unit_number || 'Unknown',
        accessMethod: log.access_method as 'qr' | 'pin',
        timestamp: new Date(log.timestamp),
        validUntil: new Date(log.access_codes?.expires_at || Date.now()),
        phoneNumber: log.access_codes?.visitors?.phone_number
      })) || [];

      setRecentAccess(formattedData);
    } catch (error) {
      console.error('Error loading recent access:', error);
    }
  };

  const handleAccessCodeVerification = async (accessCode: string, method: 'qr' | 'pin') => {
    setIsProcessing(true);
    
    try {
      // Use edge function to verify with tenant enforcement
      const { data, error } = await supabase.functions.invoke('verify-access-code', {
        body: { code: accessCode, method, community_id: activeCommunityId },
      });

      let accessData = data?.access_code;
      // Fallback to direct table query if edge function not available
      if (error || !accessData) {
        const { data: direct, error: directErr } = await (supabase as any)
          .from('access_codes')
          .select(`
            *,
            visitors (full_name, phone_number, emergency_contact),
            visit_invitations (
              residents (full_name, unit_number)
            )
          `)
          .eq(method === 'qr' ? 'qr_token' : 'pin_code', accessCode)
          .eq('is_active', true)
          .eq('community_id', activeCommunityId as string)
          .single();
        if (directErr || !direct) {
          const errorMessage = "Invalid or expired access code";
          onAccessDenied?.(errorMessage);
          toast({
            title: "Access Denied",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
        accessData = direct;
      }

      const now = new Date();
      const expiresAt = new Date(accessData.expires_at);
      
      if (now > expiresAt) {
        const errorMessage = "Access code has expired";
        onAccessDenied?.(errorMessage);
        toast({
          title: "Access Denied",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Prepare access data
      const verifiedAccess: AccessData = {
        visitorName: accessData.visitors?.full_name || 'Unknown Visitor',
        residentName: accessData.visit_invitations?.residents?.full_name || 'Unknown Resident',
        unitNumber: accessData.visit_invitations?.residents?.unit_number || 'Unknown',
        accessMethod: method,
        timestamp: now,
        validUntil: expiresAt,
        phoneNumber: accessData.visitors?.phone_number,
        emergencyContact: accessData.visitors?.emergency_contact
      };

      setLastAccessData(verifiedAccess);
      onAccessGranted?.(verifiedAccess);

      // Log the access
      await (supabase as any).from('access_logs').insert({
        access_code_id: accessData.id,
        access_method: method,
        guard_id: (await supabase.auth.getUser()).data.user?.id,
        timestamp: now.toISOString(),
        status: 'success',
        community_id: activeCommunityId,
      });

      // Update recent access
      setRecentAccess(prev => [verifiedAccess, ...prev.slice(0, 4)]);

      toast({
        title: "Access Granted",
        description: `${verifiedAccess.visitorName} verified successfully`,
        duration: 5000,
      });

    } catch (error) {
      const errorMessage = "Verification failed. Please try again.";
      onAccessDenied?.(errorMessage);
      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRSuccess = (data: string) => {
    handleAccessCodeVerification(data, 'qr');
  };

  const handlePINSuccess = (accessCode: string) => {
    handleAccessCodeVerification(accessCode, 'pin');
  };

  const formatTimeRemaining = (validUntil: Date) => {
    const now = new Date();
    const diff = validUntil.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getAccessStatusColor = (validUntil: Date) => {
    const now = new Date();
    const diff = validUntil.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining > 2) return "bg-green-500";
    if (hoursRemaining > 1) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Verification System
          </CardTitle>
          <CardDescription>
            Verify visitor access using QR code or PIN entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'qr' | 'pin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                QR Scanner
              </TabsTrigger>
              <TabsTrigger value="pin" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                PIN Entry
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr" className="mt-6">
              <QRCodeScanner
                onScanSuccess={handleQRSuccess}
                onError={(error) => toast({
                  title: "Scanner Error",
                  description: error,
                  variant: "destructive",
                })}
                isActive={activeTab === 'qr'}
              />
            </TabsContent>
            
            <TabsContent value="pin" className="mt-6">
              <PINEntry
                onSuccess={handlePINSuccess}
                onError={(error) => toast({
                  title: "PIN Error",
                  description: error,
                  variant: "destructive",
                })}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Access Result */}
      {lastAccessData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Access Granted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lastAccessData.visitorName}</span>
                <Badge variant="outline">
                  {lastAccessData.accessMethod.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Visiting {lastAccessData.residentName} • Unit {lastAccessData.unitNumber}</span>
              </div>
              
              {lastAccessData.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lastAccessData.phoneNumber}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Valid for {formatTimeRemaining(lastAccessData.validUntil)}</span>
                <div className={`w-2 h-2 rounded-full ${getAccessStatusColor(lastAccessData.validUntil)}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Access History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAccess.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent access records
            </p>
          ) : (
            <div className="space-y-3">
              {recentAccess.map((access, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {access.accessMethod.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{access.visitorName}</p>
                      <p className="text-sm text-muted-foreground">
                        Unit {access.unitNumber} • {access.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getAccessStatusColor(access.validUntil)}`} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}