import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Smartphone, Mail, Key, Shield, AlertTriangle } from 'lucide-react';

interface MFASetupProps {
  userId: string;
  onSetupComplete: (method: string) => void;
  onCancel: () => void;
}

interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface SMSSetup {
  phoneNumber: string;
  verificationCode: string;
  verified: boolean;
}

export const MFASetup: React.FC<MFASetupProps> = ({ userId, onSetupComplete, onCancel }) => {
  const [activeTab, setActiveTab] = useState('totp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // TOTP State
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');

  // SMS State
  const [smsSetup, setSmsSetup] = useState<SMSSetup>({
    phoneNumber: '',
    verificationCode: '',
    verified: false
  });

  const generateTOTPSecret = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call your backend
      const response = await fetch('/api/mfa/generate-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to generate TOTP secret');

      const data = await response.json();
      setTotpSetup(data);
    } catch (err) {
      setError('Failed to generate TOTP secret. Please try again.');
      console.error('TOTP generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!totpSetup || !totpVerificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          secret: totpSetup.secret,
          code: totpVerificationCode
        })
      });

      if (!response.ok) throw new Error('Invalid verification code');

      setSuccess('TOTP authentication successfully configured!');
      setTimeout(() => onSetupComplete('totp'), 2000);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendSMSVerification = async () => {
    if (!smsSetup.phoneNumber) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phoneNumber: smsSetup.phoneNumber
        })
      });

      if (!response.ok) throw new Error('Failed to send SMS');

      setSuccess('Verification code sent to your phone!');
    } catch (err) {
      setError('Failed to send SMS verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifySMS = async () => {
    if (!smsSetup.verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phoneNumber: smsSetup.phoneNumber,
          code: smsSetup.verificationCode
        })
      });

      if (!response.ok) throw new Error('Invalid verification code');

      setSmsSetup(prev => ({ ...prev, verified: true }));
      setSuccess('SMS authentication successfully configured!');
      setTimeout(() => onSetupComplete('sms'), 2000);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'totp' && !totpSetup) {
      generateTOTPSecret();
    }
  }, [activeTab]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Set Up Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by enabling two-factor authentication.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <Key className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Authenticator App
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SMS Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              <p>Use an authenticator app like Google Authenticator, Authy, or 1Password.</p>
            </div>

            {totpSetup && (
              <div className="space-y-4">
                <div className="text-center">
                  <img 
                    src={totpSetup.qrCodeUrl} 
                    alt="QR Code for TOTP setup"
                    className="mx-auto border rounded-lg p-2 bg-white"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totpCode">Verification Code</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={totpVerificationCode}
                    onChange={(e) => setTotpVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={verifyTOTP}
                  disabled={loading || totpVerificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable TOTP'}
                </Button>

                {totpSetup.backupCodes.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Backup Codes</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {totpSetup.backupCodes.map((code, index) => (
                        <div key={index} className="bg-white px-2 py-1 rounded border">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              <p>Receive verification codes via SMS to your mobile phone.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254700000000"
                  value={smsSetup.phoneNumber}
                  onChange={(e) => setSmsSetup(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={smsSetup.verified}
                />
              </div>

              {!smsSetup.verified && (
                <Button 
                  onClick={sendSMSVerification}
                  disabled={loading || !smsSetup.phoneNumber}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="smsCode">Verification Code</Label>
                <Input
                  id="smsCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={smsSetup.verificationCode}
                  onChange={(e) => setSmsSetup(prev => ({ ...prev, verificationCode: e.target.value }))}
                  maxLength={6}
                  disabled={smsSetup.verified}
                />
              </div>

              {!smsSetup.verified && (
                <Button 
                  onClick={verifySMS}
                  disabled={loading || smsSetup.verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable SMS'}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
