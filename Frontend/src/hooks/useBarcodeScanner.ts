// hooks/useBarcodeScanner.ts — Camera-based barcode scanning via the native BarcodeDetector API
import { useCallback, useEffect, useRef, useState } from 'react';

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied' | 'error';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export function useBarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [isSupported] = useState(() => typeof window !== 'undefined' && !!window.BarcodeDetector);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(
    async (onDetected: (code: string) => void) => {
      if (!isSupported) {
        setStatus('unsupported');
        return;
      }
      setStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new window.BarcodeDetector!({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
        });

        setStatus('scanning');

        const tick = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetected(codes[0].rawValue);
              return; // stop the loop; caller decides whether to restart
            }
          } catch {
            // transient detection errors are expected mid-frame; keep scanning
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    },
    [isSupported]
  );

  useEffect(() => stop, [stop]);

  return { videoRef, status, isSupported, start, stop };
}
