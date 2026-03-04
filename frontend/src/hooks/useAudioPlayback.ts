import { useCallback, useRef } from 'react';

export function useAudioPlayback() {
  const contextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const initializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    try {
      const ctx = new AudioContext({ sampleRate: 48000 });
      contextRef.current = ctx;

      await ctx.audioWorklet.addModule('/pcm-playback-processor.js');

      const workletNode = new AudioWorkletNode(ctx, 'pcm-playback-processor', {
        processorOptions: { sourceSampleRate: 24000, bufferSize: 48000 * 4 },
        outputChannelCount: [1],
      });
      workletNodeRef.current = workletNode;
      workletNode.connect(ctx.destination);

      initializedRef.current = true;
    } catch (e) {
      console.error('Audio playback init failed:', e);
    }
  }, []);

  const playAudio = useCallback(async (audioBuffer: ArrayBuffer) => {
    if (!initializedRef.current) {
      await initialize();
    }
    const node = workletNodeRef.current;
    if (!node) return;

    // Resume AudioContext if suspended (browser autoplay policy)
    if (contextRef.current?.state === 'suspended') {
      await contextRef.current.resume();
    }

    // Transfer the buffer to the worklet
    const copy = audioBuffer.slice(0);
    node.port.postMessage({ type: 'audio', buffer: copy }, [copy]);
  }, [initialize]);

  const clearBuffer = useCallback(() => {
    workletNodeRef.current?.port.postMessage({ type: 'clear' });
  }, []);

  return { initialize, playAudio, clearBuffer };
}
