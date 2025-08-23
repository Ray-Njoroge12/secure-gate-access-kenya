import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Flashlight, 
  FlashlightOff,
  ScanLine,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface QRScannerProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export function MobileQRScanner({ onScanResult, onClose, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [lastScanResult, setLastScanResult] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);

  // QR Code detection using basic image processing
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a simplified QR detection - in production, use a library like jsQR
    // For demo purposes, we'll simulate QR detection
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Simple pattern detection for demo
    // In real implementation, use jsQR or similar library
    const data = imageData.data;
    let darkPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 128) darkPixels++;
    }

    const darkRatio = darkPixels / totalPixels;
    
    // Mock QR code detection based on dark pixel ratio
    if (darkRatio > 0.3 && darkRatio < 0.7) {
      // Generate a mock QR code result for demo
      const mockCodes = [
        'ACCESS_CODE_12345',
        'VISITOR_TOKEN_67890',
        'SECURITY_PASS_ABCDE',
        'GATE_ACCESS_XYZ123'
      ];
      return mockCodes[Math.floor(Math.random() * mockCodes.length)];
    }

    return null;
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

    } catch (err) {
      setError('Camera access denied or not available');
      setIsScanning(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const toggleFlashlight = async () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any]
          });
          setFlashlightOn(!flashlightOn);
        } catch (err) {
          console.error('Flashlight control failed:', err);
        }
      }
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !isScanning) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = detectQRCode(imageData);

    if (qrResult && qrResult !== lastScanResult) {
      setLastScanResult(qrResult);
      setScanCount(prev => prev + 1);
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      onScanResult(qrResult);
      stopCamera();
    }
  };

  useEffect(() => {
    if (isActive && !isScanning) {
      startCamera();
    } else if (!isActive && isScanning) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, facingMode]);

  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    
    if (isScanning && videoRef.current) {
      scanInterval = setInterval(scanFrame, 100); // Scan every 100ms
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [isScanning, lastScanResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-semibold">Scan QR Code</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        {isScanning && !error ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 border-2 border-white border-opacity-50 relative">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="animate-pulse">
                      <ScanLine className="w-full h-1 text-blue-500 animate-bounce" />
                    </div>
                  </div>
                </div>
                
                <p className="text-white text-center mt-4 bg-black bg-opacity-50 p-2 rounded">
                  Position QR code within the frame
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-80 mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CameraOff className="h-5 w-5" />
                  Camera Access
                </CardTitle>
                <CardDescription>
                  {error || 'Camera is not active'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={startCamera} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Flashlight Toggle */}
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleFlashlight}
            className="text-white hover:bg-white hover:bg-opacity-20"
            disabled={!isScanning}
          >
            {flashlightOn ? (
              <FlashlightOff className="h-6 w-6" />
            ) : (
              <Flashlight className="h-6 w-6" />
            )}
          </Button>

          {/* Camera Switch */}
          <Button
            variant="ghost"
            size="lg"
            onClick={switchCamera}
            className="text-white hover:bg-white hover:bg-opacity-20"
            disabled={!isScanning}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          {/* Scan Status */}
          <div className="text-white text-center">
            <p className="text-sm">
              {isScanning ? 'Scanning...' : 'Camera stopped'}
            </p>
            {scanCount > 0 && (
              <p className="text-xs text-green-400">
                Scans: {scanCount}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
