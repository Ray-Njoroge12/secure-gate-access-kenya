import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, RotateCcw, Flashlight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from "@zxing/browser";

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
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const videoDevices = (await BrowserMultiFormatReader.listVideoInputDevices()) || [];
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
        }
      } catch (err) {
        setError("Unable to enumerate camera devices");
        onError?.("Unable to enumerate camera devices");
      }
    };
    init();
  }, [onError]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      readerRef.current = new BrowserMultiFormatReader();

      const constraints: MediaTrackConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: { ideal: "environment" } };

      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId || undefined,
        videoRef.current,
        (result, err, controls) => {
          if (result) {
            onScanSuccess(result.getText());
            controls?.stop();
            setIsScanning(false);
            toast({ title: "QR Code Scanned", description: "Access code detected successfully" });
          } else if (err) {
            // frequent not-found errors are expected during scanning
          }
        },
        constraints
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera access denied";
      setError(message);
      setHasPermission(false);
      onError?.(message);
      toast({ title: "Camera Error", description: message, variant: "destructive" });
    }
  };

  const stopScanning = async () => {
    setIsScanning(false);
    try {
      await readerRef.current?.reset();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    readerRef.current = null;
  };

  const toggleTorch = async () => {
    try {
      const stream = (videoRef.current as HTMLVideoElement)?.srcObject as MediaStream | undefined;
      const track = stream?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.();
      if (track && capabilities && 'torch' in capabilities) {
        const newState = !torchEnabled;
        await track.applyConstraints({ advanced: [{ torch: newState }] as MediaTrackConstraints });
        setTorchEnabled(newState);
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, selectedDeviceId]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>Point your camera at the QR code to scan access codes</CardDescription>
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
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          {isScanning ? (
            <div className="absolute inset-0 border-2 border-primary rounded-lg" />
          ) : (
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
          <Button onClick={isScanning ? stopScanning : startScanning} className="flex-1" variant={isScanning ? "destructive" : "default"}>
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
              <Button onClick={toggleTorch} variant="outline" size="icon" title="Toggle flashlight">
                <Flashlight className={`h-4 w-4 ${torchEnabled ? "text-yellow-500" : ""}`} />
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
      </CardContent>
    </Card>
  );
}