import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, RotateCcw, Flashlight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export function QRCodeScanner({ onScanSuccess, onError, isActive = false }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Check for camera permission and enumerate devices
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId); // Prefer back camera
        }
      } catch (err) {
        setError("Unable to access camera devices");
        onError?.("Unable to access camera devices");
      }
    };

    checkPermissions();
  }, [onError]);

  // QR Code scanning logic using Canvas and ImageData
  const scanQRCode = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR code pattern detection (basic implementation)
    // In production, you'd use a proper QR scanning library like @zxing/library
    try {
      // This is a placeholder - you'd integrate with a proper QR library here
      const data = detectQRPattern(imageData);
      if (data) {
        onScanSuccess(data);
        stopScanning();
        toast({
          title: "QR Code Scanned",
          description: "Access code detected successfully",
        });
      }
    } catch (err) {
      // Continue scanning
    }
  };

  // Basic QR pattern detection (placeholder - replace with proper library)
  const detectQRPattern = (imageData: ImageData): string | null => {
    // This is a simplified detection - in reality you'd use a proper QR scanner
    // For now, we'll simulate successful scanning after a few seconds
    const randomData = Math.random();
    if (randomData > 0.95) { // 5% chance to simulate successful scan
      return `GATE_ACCESS_${Date.now()}`;
    }
    return null;
  };

  const startScanning = async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: selectedDeviceId ? undefined : { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        setHasPermission(true);

        // Enable torch if supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: torchEnabled } as MediaTrackConstraintSet]
          });
        }

        // Start scanning loop
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const scanLoop = () => {
          if (isScanning && context) {
            scanQRCode(canvas, context);
            scannerRef.current = requestAnimationFrame(scanLoop);
          }
        };
        
        scanLoop();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Camera access denied";
      setError(errorMessage);
      setHasPermission(false);
      onError?.(errorMessage);
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (scannerRef.current) {
      cancelAnimationFrame(scannerRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        const newTorchState = !torchEnabled;
        await track.applyConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setTorchEnabled(newTorchState);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, selectedDeviceId, startScanning, stopScanning]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Point your camera at the QR code to scan access codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasPermission === false && (
          <Alert>
            <AlertDescription>
              Camera permission is required to scan QR codes. Please enable camera access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {isScanning && (
            <div className="absolute inset-0 border-2 border-primary rounded-lg">
              <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-primary"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-primary"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-primary"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-primary"></div>
              
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-primary opacity-50 animate-pulse"></div>
            </div>
          )}
          
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        {devices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <Button
            onClick={isScanning ? stopScanning : startScanning}
            className="flex-1"
            variant={isScanning ? "destructive" : "default"}
          >
            {isScanning ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Scanning
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </>
            )}
          </Button>

          {isScanning && (
            <>
              <Button
                onClick={toggleTorch}
                variant="outline"
                size="icon"
                title="Toggle flashlight"
              >
                <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-yellow-500' : ''}`} />
              </Button>
              
              <Button
                onClick={() => {
                  stopScanning();
                  setTimeout(startScanning, 100);
                }}
                variant="outline"
                size="icon"
                title="Restart scanner"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {isScanning && (
          <p className="text-sm text-muted-foreground text-center">
            Hold steady and ensure the QR code is clearly visible
          </p>
        )}
      </CardContent>
    </Card>
  );
}