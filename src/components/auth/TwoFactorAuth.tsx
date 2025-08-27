import { useState, useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
// QR code generation will be handled via the 'qrcode' library to avoid missing dependency types
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Shield, ShieldCheck, AlertTriangle, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";

interface TwoFactorAuthProps {
  onClose?: () => void;
}

export const TwoFactorAuth = ({ onClose }: TwoFactorAuthProps) => {
  const { toast } = useToast();
  const { session, getAccessToken } = useAuthSession();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<'check' | 'setup' | 'verify'>('check');
  
  // Setup state
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState<number[]>([]);
  
  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      if (!session?.user) return;

      // TODO: Replace with FastAPI endpoint for 2FA status
      // const response = await apiClient.getTwoFactorStatus();
      // const data = response.data;
      const data = { enabled: false }; // Placeholder until FastAPI endpoint is implemented
      const error = null;

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking 2FA status:', error);
        return;
      }

      setIsEnabled(data?.enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSetupTwoFactor = async () => {
    setIsLoading(true);
    try {
  if (!session?.user) throw new Error('Not authenticated');

      // TODO: Replace with FastAPI endpoint for 2FA setup
      // const response = await apiClient.setupTwoFactor();
      // const data = response.data;
      const data = { secret: 'placeholder-secret', qrCodeUrl: 'placeholder-url', backupCodes: ['code1', 'code2'] }; // Placeholder until FastAPI endpoint is implemented
      const error = null;

      setQrCodeUrl(data.qrCodeUrl);
      // Generate a data URL for display
      if (data.qrCodeUrl) {
        try {
          const generated = await QRCode.toDataURL(data.qrCodeUrl);
          setQrCodeDataUrl(generated);
        } catch (e) {
          console.warn('Failed generating QR code data URL', e);
        }
      }
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setSetupStep('setup');
    } catch (error) {
      toast({
        title: "Setup Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
  if (!session?.user) throw new Error('Not authenticated');

      // TODO: Replace with FastAPI endpoint for 2FA enable
      // const response = await apiClient.enableTwoFactor(verificationCode);
      // const data = response.data;
      const data = { success: true }; // Placeholder until FastAPI endpoint is implemented
      const error = null;

      setIsEnabled(true);
      setSetupStep('check');
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
      
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter a verification code to disable 2FA.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
  if (!session?.user) throw new Error('Not authenticated');

      // TODO: Replace with FastAPI endpoint for 2FA disable
      // const response = await apiClient.disableTwoFactor(verificationCode);
      // const data = response.data;
      const data = { success: true }; // Placeholder until FastAPI endpoint is implemented
      const error = null;

      setIsEnabled(false);
      setVerificationCode('');
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error) {
      toast({
        title: "Disable Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'code', index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else if (typeof index === 'number') {
        setCopiedCodes(prev => [...prev, index]);
        setTimeout(() => {
          setCopiedCodes(prev => prev.filter(i => i !== index));
        }, 2000);
      }
      
      toast({
        title: "Copied",
        description: `${type === 'secret' ? 'Secret key' : 'Backup code'} copied to clipboard.`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (setupStep === 'check') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <ShieldCheck className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h3 className="font-medium">
                  2FA is {isEnabled ? 'Enabled' : 'Disabled'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? 'Your account is protected with two-factor authentication.'
                    : 'Your account is not protected with two-factor authentication.'
                  }
                </p>
              </div>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {!isEnabled ? (
            <div className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  You'll need an authenticator app like Google Authenticator, Authy, or 1Password to set up 2FA.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleSetupTwoFactor}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Disabling 2FA will make your account less secure. You'll need to verify with a code to disable it.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label htmlFor="disable-code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="disable-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <Button 
                variant="destructive"
                onClick={handleDisableTwoFactor}
                disabled={isLoading || !verificationCode}
                className="w-full"
              >
                {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'setup') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app and save your backup codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr" className="space-y-4">
              <div className="flex justify-center p-6 border rounded-lg bg-white">
                {qrCodeDataUrl && (
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="h-[200px] w-[200px]" />
                )}
              </div>
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Secret Key</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(secret, 'secret')}
                  >
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  Enter this secret key manually in your authenticator app if you can't scan the QR code.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">Backup Codes</h3>
              <Alert className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Save these backup codes securely. You can use them to access your account if you lose your authenticator device.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={code} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(code, 'code', index)}
                    >
                      {copiedCodes.includes(index) ? 
                        <Check className="h-4 w-4" /> : 
                        <Copy className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSetupStep('check')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setSetupStep('verify')}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to complete setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="verify-code" className="text-sm font-medium">
              Verification Code
            </label>
            <Input
              id="verify-code"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSetupStep('setup')}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleEnableTwoFactor}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Enable 2FA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};