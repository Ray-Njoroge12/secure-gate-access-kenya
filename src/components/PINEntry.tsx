import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  KeyRound, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Phone,
  Clock,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PINEntryProps {
  onSuccess: (accessCode: string) => void;
  onError?: (error: string) => void;
  maxAttempts?: number;
  lockoutDuration?: number; // in minutes
}

export function PINEntry({ 
  onSuccess, 
  onError, 
  maxAttempts = 3, 
  lockoutDuration = 15 
}: PINEntryProps) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  
  const pinInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus on PIN input when component mounts
  useEffect(() => {
    if (!isLocked) {
      pinInputRef.current?.focus();
    }
  }, [isLocked]);

  // Handle lockout timer
  useEffect(() => {
    if (lockoutEndTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeLeft = Math.max(0, lockoutEndTime.getTime() - now.getTime());
        setRemainingTime(Math.ceil(timeLeft / 1000));
        
        if (timeLeft <= 0) {
          setIsLocked(false);
          setLockoutEndTime(null);
          setAttempts(0);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutEndTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || pin.length < 4) return;

    setIsVerifying(true);
    try {
      // Use secure backend verification (handles Argon2 hash, expiry, single-use, and auditing)
      const { data, error } = await supabase.functions.invoke('verify-access-code', {
        body: { code: pin },
      });

      if (error || !data?.access_code) {
        handleFailedAttempt(error?.message);
        return;
      }

      const accessCode = data.access_code;
      onSuccess(accessCode.qr_token);
      setPin("");
      setAttempts(0);

      toast({
        title: "Access Granted",
        description: "PIN verified successfully",
        duration: 3000,
      });
    } catch (_err) {
      handleFailedAttempt("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFailedAttempt = (customMessage?: string) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin("");
    
    const message = customMessage || `Invalid PIN. ${maxAttempts - newAttempts} attempts remaining.`;
    
    if (newAttempts >= maxAttempts) {
      // Lock out user
      const lockoutEnd = new Date(Date.now() + lockoutDuration * 60 * 1000);
      setLockoutEndTime(lockoutEnd);
      setIsLocked(true);
      setShowEmergencyAccess(true);
      
      toast({
        title: "Account Locked",
        description: `Too many failed attempts. Try again in ${lockoutDuration} minutes.`,
        variant: "destructive",
        duration: 5000,
      });
      
      onError?.(`Account locked for ${lockoutDuration} minutes`);
    } else {
      toast({
        title: "Invalid PIN",
        description: message,
        variant: "destructive",
        duration: 3000,
      });
      
      onError?.(message);
    }
  };

  const handleEmergencyAccess = async () => {
    if (!emergencyCode) return;
    
    setIsVerifying(true);
    
    try {
      // Verify emergency code (this would typically be a special admin code)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if emergency code is valid
      const { data: emergencyAccess, error } = await supabase
        .from('emergency_access_codes')
        .select('*')
        .eq('code', emergencyCode)
        .eq('is_active', true)
        .single();

      if (error || !emergencyAccess) {
        toast({
          title: "Invalid Emergency Code",
          description: "Please contact security for assistance",
          variant: "destructive",
        });
        return;
      }

      // Reset lockout
      setIsLocked(false);
      setLockoutEndTime(null);
      setAttempts(0);
      setShowEmergencyAccess(false);
      setEmergencyCode("");

      toast({
        title: "Emergency Access Granted",
        description: "Lockout has been reset",
      });

      // Log emergency access use
      await supabase.from('access_logs').insert({
        user_id: user.id,
        access_method: 'emergency',
        timestamp: new Date().toISOString(),
        status: 'success',
        notes: 'Emergency access used to reset PIN lockout'
      });

    } catch (error) {
      toast({
        title: "Emergency Access Failed",
        description: "Please contact security immediately",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const requestSMSCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Request SMS backup code
      const { error } = await supabase.functions.invoke('send-sms-backup-code', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "SMS Sent",
        description: "Backup access code sent to your registered phone number",
      });

    } catch (error) {
      toast({
        title: "SMS Request Failed",
        description: "Unable to send backup code. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const generateVirtualKeyboard = () => {
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {numbers.slice(0, 9).map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            onClick={() => {
              if (pin.length < 6) {
                setPin(prev => prev + num);
              }
            }}
            disabled={isLocked || isVerifying}
            className="h-12 text-lg font-mono"
          >
            {num}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => setPin(prev => prev.slice(0, -1))}
          disabled={isLocked || isVerifying || pin.length === 0}
          className="h-12"
        >
          ←
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            if (pin.length < 6) {
              setPin(prev => prev + '0');
            }
          }}
          disabled={isLocked || isVerifying}
          className="h-12 text-lg font-mono"
        >
          0
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => setPin("")}
          disabled={isLocked || isVerifying || pin.length === 0}
          className="h-12"
        >
          Clear
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          PIN Entry
        </CardTitle>
        <CardDescription>
          Enter your access PIN as an alternative to QR scanning
        </CardDescription>
        
        {attempts > 0 && (
          <Badge variant="destructive" className="w-fit">
            {attempts}/{maxAttempts} attempts used
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account locked due to too many failed attempts. 
              Time remaining: {formatTime(remainingTime)}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Access PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                ref={pinInputRef}
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(value);
                }}
                disabled={isLocked || isVerifying}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              <div className="absolute right-3 top-3">
                {pin.length >= 4 && !isVerifying && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {isVerifying && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
            </div>
          </div>

          {/* Virtual Keyboard */}
          {generateVirtualKeyboard()}

          <Button
            type="submit"
            className="w-full"
            disabled={isLocked || isVerifying || pin.length < 4}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify PIN
              </>
            )}
          </Button>
        </form>

        {/* Emergency Access */}
        {showEmergencyAccess && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Emergency Access
            </h3>
            
            <div className="space-y-2">
              <Input
                placeholder="Emergency access code"
                value={emergencyCode}
                onChange={(e) => setEmergencyCode(e.target.value)}
                disabled={isVerifying}
              />
              <Button
                onClick={handleEmergencyAccess}
                variant="outline"
                className="w-full"
                disabled={isVerifying || !emergencyCode}
              >
                Reset Lockout
              </Button>
            </div>
            
            <Button
              onClick={requestSMSCode}
              variant="outline"
              className="w-full"
              disabled={isVerifying}
            >
              <Phone className="h-4 w-4 mr-2" />
              Request SMS Code
            </Button>
          </div>
        )}

        {/* Security Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• PIN attempts: {attempts}/{maxAttempts}</p>
          <p>• Lockout duration: {lockoutDuration} minutes</p>
          <p>• For assistance, contact security</p>
        </div>
      </CardContent>
    </Card>
  );
}