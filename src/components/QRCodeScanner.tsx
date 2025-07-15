import { useEffect, useRef, useState } from 'react';

interface QRCodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const QRCodeScanner = ({ onResult, onError, className = '' }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!videoRef.current) return;
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReaderRef.current = new BrowserMultiFormatReader();
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const selectedDeviceId = videoInputDevices[0]?.deviceId;
        if (!selectedDeviceId) throw new Error('No camera found');
        codeReaderRef.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result && isMounted) {
              setScanning(false);
              if (navigator.vibrate) navigator.vibrate(100);
              onResult(result.getText());
            }
            if (err && err.name !== 'NotFoundException' && onError) {
              onError(err);
            }
          }
        );
        // Get stream for flashlight
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedDeviceId } });
        setStream(mediaStream);
      } catch (err: any) {
        if (onError) onError(err);
      }
    })();
    return () => {
      isMounted = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResult, onError]);

  // Flashlight toggle (if supported)
  const handleFlashToggle = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    // @ts-ignore
    const capabilities = videoTrack.getCapabilities?.();
    if (capabilities && capabilities.torch) {
      // @ts-ignore
      await videoTrack.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn((f) => !f);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center relative ${className}`} aria-label="QR code scanner">
      <div className="relative w-full max-w-xs aspect-video flex items-center justify-center">
        <video ref={videoRef} className="rounded-lg border w-full aspect-video" autoPlay muted playsInline aria-label="Camera view for QR scanning" />
        {/* Visual frame overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="border-4 border-primary rounded-lg w-4/5 h-3/5" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3) inset' }} />
        </div>
        {/* Scanning overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg font-bold animate-pulse" aria-live="polite">
            Scanning...
          </div>
        )}
      </div>
      {/* Flashlight toggle if supported */}
      <button
        type="button"
        className="mt-2 px-4 py-2 rounded bg-primary text-white text-sm shadow"
        onClick={handleFlashToggle}
        aria-label={flashOn ? 'Turn off flashlight' : 'Turn on flashlight'}
        style={{ display: stream ? undefined : 'none' }}
      >
        {flashOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
      </button>
      <div className="text-xs text-muted-foreground mt-2">Align QR code within the frame</div>
    </div>
  );
};