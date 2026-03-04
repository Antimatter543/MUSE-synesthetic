import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionStatus, MuseEvent } from '../types/events';

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

interface UseWebSocketOptions {
  sessionId: string;
  onEvent: (event: MuseEvent) => void;
  onAudio: (pcmBytes: ArrayBuffer) => void;
}

export function useWebSocket({ sessionId, onEvent, onAudio }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    shouldReconnect.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_BACKEND_URL
      ? new URL(import.meta.env.VITE_BACKEND_URL).host
      : window.location.host;
    const url = `${protocol}//${host}/ws/${sessionId}`;

    setStatus('connecting');
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectCount.current = 0;
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      if (
        shouldReconnect.current &&
        reconnectCount.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectCount.current++;
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onmessage = (ev) => {
      if (ev.data instanceof ArrayBuffer) {
        // Binary frame: header (JSON + null byte) + PCM audio bytes
        const buf = new Uint8Array(ev.data);
        const nullIdx = buf.indexOf(0);
        if (nullIdx !== -1) {
          const headerBytes = buf.slice(0, nullIdx);
          const audioBytes = ev.data.slice(nullIdx + 1);
          try {
            const header = JSON.parse(new TextDecoder().decode(headerBytes));
            if (header.type === 'audio') {
              onAudio(audioBytes);
            }
          } catch {
            // Raw audio without header
            onAudio(ev.data);
          }
        }
      } else if (typeof ev.data === 'string') {
        try {
          const event = JSON.parse(ev.data) as MuseEvent;
          onEvent(event);
        } catch {
          console.warn('Failed to parse WebSocket JSON:', ev.data);
        }
      }
    };
  }, [sessionId, onEvent, onAudio]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const sendJSON = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { status, sendBinary, sendJSON, connect, disconnect };
}
