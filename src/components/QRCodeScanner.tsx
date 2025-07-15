import { useEffect, useRef } from 'react';

interface QRCodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const QRCodeScanner = ({ onResult, onError, className = '' }: QRCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);

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
              onResult(result.getText());
            }
            if (err && err.name !== 'NotFoundException' && onError) {
              onError(err);
            }
          }
        );
      } catch (err: any) {
        if (onError) onError(err);
      }
    })();
    return () => {
      isMounted = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [onResult, onError]);

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <video ref={videoRef} className="rounded-lg border w-full max-w-xs aspect-video" autoPlay muted playsInline />
      <div className="text-xs text-muted-foreground mt-2">Align QR code within the frame</div>
    </div>
  );
};