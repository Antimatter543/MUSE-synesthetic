import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAudioCaptureOptions {
  onPCMChunk: (buffer: ArrayBuffer) => void;
  enabled: boolean;
}

export function useAudioCapture({ onPCMChunk, enabled }: UseAudioCaptureOptions) {
  const contextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 48000 });
      contextRef.current = ctx;

      await ctx.audioWorklet.addModule('/pcm-capture-processor.js');

      const workletNode = new AudioWorkletNode(ctx, 'pcm-capture-processor', {
        processorOptions: { targetSampleRate: 16000, chunkSize: 4096 },
      });
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        if (e.data.type === 'pcm') {
          onPCMChunk(e.data.buffer);
          // Compute rough audio level from last chunk
          const int16 = new Int16Array(e.data.buffer.slice(0, 256));
          let sum = 0;
          for (let i = 0; i < int16.length; i++) {
            sum += Math.abs(int16[i]);
          }
          setAudioLevel(sum / int16.length / 32768);
        }
      };

      const source = ctx.createMediaStreamSource(stream);
      source.connect(workletNode);
      // Don't connect to destination (no mic echo)

      setIsCapturing(true);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Microphone access denied';
      setError(msg);
    }
  }, [onPCMChunk]);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    contextRef.current?.close();
    contextRef.current = null;
    setIsCapturing(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, start, stop]);

  return { isCapturing, error, audioLevel };
}
