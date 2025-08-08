import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Smartphone, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
  userToken: string;
}

export const TwoFactorVerify = ({ onSuccess, onCancel, userToken }: TwoFactorVerifyProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp');

  const handleVerify = async () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter a verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-2fa', {
        body: {
          action: 'verify',
          token: userToken,
          code: verificationCode,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification Successful",
        description: data.usedBackupCode 
          ? "Backup code verified. Consider regenerating your backup codes."
          : "Authentication successful.",
      });

      onSuccess();
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

  const handleCodeChange = (value: string) => {
    if (activeTab === 'totp') {
      // TOTP codes are 6 digits
      setVerificationCode(value.replace(/\D/g, '').slice(0, 6));
    } else {
      // Backup codes are 8 characters, alphanumeric
      setVerificationCode(value.toUpperCase().slice(0, 8));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter your verification code to complete sign in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as 'totp' | 'backup');
          setVerificationCode('');
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              App Code
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp" className="space-y-4">
            <div>
              <label htmlFor="totp-code" className="text-sm font-medium">
                Authentication Code
              </label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono mt-1"
                autoFocus
              />
            </div>
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Open your authenticator app and enter the 6-digit code.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4">
            <div>
              <label htmlFor="backup-code" className="text-sm font-medium">
                Backup Code
              </label>
              <Input
                id="backup-code"
                placeholder="XXXXXXXX"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={8}
                className="text-center text-lg tracking-widest font-mono mt-1"
                autoFocus
              />
            </div>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Enter one of your 8-character backup codes. Each code can only be used once.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Button 
            onClick={handleVerify}
            disabled={isLoading || !verificationCode}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'totp' ? 'backup' : 'totp')}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {activeTab === 'totp' 
              ? "Can't access your authenticator? Use a backup code"
              : "Have access to your authenticator? Use app code"
            }
          </button>
        </div>
      </CardContent>
    </Card>
  );
};