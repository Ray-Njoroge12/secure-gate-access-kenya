import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileQRScanner } from './MobileQRScanner';
import { usePWA, queueOfflineAction } from '@/hooks/usePWA';
import {
  QrCode,
  Hash,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Smartphone,
  RefreshCw,
  Camera,
  HardDrive
} from 'lucide-react';

interface MobileSecurityControlsProps {
  onAccessVerification: (code: string, method: 'qr' | 'pin') => Promise<any>;
  stats: {
    todaysVisitors: number;
    pendingVerifications: number;
    usedCodes: number;
  };
  isOfflineMode?: boolean;
}

export function MobileSecurityControls({ 
  onAccessVerification, 
  stats, 
  isOfflineMode = false 
}: MobileSecurityControlsProps) {
  const [pinCode, setPinCode] = useState('');
  const [isQRScannerActive, setIsQRScannerActive] = useState(false);
  const [lastVerification, setLastVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { isOffline, isInstallable, install } = usePWA();

  // Handle number pad input
  const handleNumberInput = (digit: string) => {
    if (pinCode.length < 6) {
      setPinCode(prev => prev + digit);
    }
  };

  const clearPin = () => {
    setPinCode('');
  };

  const deleteLastDigit = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  // Handle PIN verification
  const handlePinVerification = async () => {
    if (pinCode.length < 4) return;
    
    setIsVerifying(true);
    try {
      const result = await onAccessVerification(pinCode, 'pin');
      setLastVerification({ ...result, method: 'pin', code: pinCode });
      
      if (!result.valid && isOffline) {
        // Queue for background sync when online
        queueOfflineAction('access-verification', {
          code: pinCode,
          method: 'pin',
          timestamp: Date.now()
        });
      }
      
      // Clear PIN after verification
      setTimeout(() => {
        setPinCode('');
      }, 2000);
      
    } catch (error) {
      console.error('PIN verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle QR scan result
  const handleQRScanResult = async (qrData: string) => {
    setIsQRScannerActive(false);
    setIsVerifying(true);
    
    try {
      const result = await onAccessVerification(qrData, 'qr');
      setLastVerification({ ...result, method: 'qr', code: qrData });
      
      if (!result.valid && isOffline) {
        queueOfflineAction('access-verification', {
          code: qrData,
          method: 'qr',
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('QR verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify PIN when 6 digits are entered
  useEffect(() => {
    if (pinCode.length === 6) {
      handlePinVerification();
    }
  }, [pinCode]);

  const numberPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Status Bar */}
      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <Wifi className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isOffline ? 'Offline Mode' : 'Online'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isInstallable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={install}
              className="h-8 w-8 p-0"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          )}
          <Badge variant="outline" className="text-xs">
            {stats.todaysVisitors} visitors today
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-sm font-semibold">{stats.todaysVisitors}</div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-sm font-semibold">{stats.pendingVerifications}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-sm font-semibold">{stats.usedCodes}</div>
            <div className="text-xs text-gray-500">Used</div>
          </div>
        </Card>
      </div>

      {/* Access Methods */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsQRScannerActive(true)}
          className="h-20 flex-col space-y-2"
          disabled={isVerifying}
        >
          <QrCode className="h-8 w-8" />
          <span>Scan QR</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            // Focus on PIN input area
            document.getElementById('pin-display')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="h-20 flex-col space-y-2"
          disabled={isVerifying}
        >
          <Hash className="h-8 w-8" />
          <span>Enter PIN</span>
        </Button>
      </div>

      {/* PIN Input Display */}
      <Card id="pin-display">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">Enter Access PIN</CardTitle>
          <CardDescription className="text-center">
            {isOffline && (
              <div className="flex items-center justify-center text-orange-600 mb-2">
                <HardDrive className="h-4 w-4 mr-1" />
                Offline verification mode
              </div>
            )}
            Enter the 4-6 digit access code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* PIN Display */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
                    i < pinCode.length
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {i < pinCode.length ? '●' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {numberPadButtons.flat().map((button) => (
              <Button
                key={button}
                variant="outline"
                size="lg"
                onClick={() => {
                  if (button === '*') {
                    clearPin();
                  } else if (button === '#') {
                    deleteLastDigit();
                  } else {
                    handleNumberInput(button);
                  }
                }}
                className="h-12 text-lg font-semibold"
                disabled={isVerifying}
              >
                {button === '*' ? (
                  <RefreshCw className="h-5 w-5" />
                ) : button === '#' ? (
                  '⌫'
                ) : (
                  button
                )}
              </Button>
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handlePinVerification}
            disabled={pinCode.length < 4 || isVerifying}
            className="w-full h-12"
            size="lg"
          >
            {isVerifying ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Shield className="h-5 w-5 mr-2" />
            )}
            {isVerifying ? 'Verifying...' : 'Verify Access'}
          </Button>
        </CardContent>
      </Card>

      {/* Last Verification Result */}
      {lastVerification && (
        <Alert className={`${lastVerification.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center space-x-2">
            {lastVerification.valid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {lastVerification.valid ? 'Access Granted' : 'Access Denied'}
              </div>
              {lastVerification.visitorName && (
                <div className="text-sm text-gray-600">
                  Visitor: {lastVerification.visitorName}
                </div>
              )}
              {lastVerification.residentName && (
                <div className="text-sm text-gray-600">
                  Host: {lastVerification.residentName}
                </div>
              )}
              <div className="text-xs text-gray-500">
                Method: {lastVerification.method?.toUpperCase()} | 
                Code: {lastVerification.code?.slice(0, 4)}***
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* QR Scanner Modal */}
      {isQRScannerActive && (
        <MobileQRScanner
          onScanResult={handleQRScanResult}
          onClose={() => setIsQRScannerActive(false)}
          isActive={isQRScannerActive}
        />
      )}
    </div>
  );
}
