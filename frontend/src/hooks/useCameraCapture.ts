import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCameraCaptureOptions {
  onFrame: (jpegB64: string) => void;
  enabled: boolean;
  fps?: number;
  resolution?: number;
}

export function useCameraCapture({
  onFrame,
  enabled,
  fps = 1,
  resolution = 768,
}: UseCameraCaptureOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, resolution, resolution);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const b64 = dataUrl.split(',')[1];
    onFrame(b64);
  }, [onFrame, resolution]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: resolution },
          height: { ideal: resolution },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;
      setStream(stream);

      // Create hidden video element for frame capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      videoRef.current = video;

      // Offscreen canvas for JPEG encoding
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      canvasRef.current = canvas;

      await video.play();

      intervalRef.current = setInterval(captureFrame, 1000 / fps);
      setIsCapturing(true);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access denied';
      setError(msg);
    }
  }, [captureFrame, fps, resolution]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    canvasRef.current = null;
    setIsCapturing(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, start, stop]);

  return { isCapturing, error, stream };
}
