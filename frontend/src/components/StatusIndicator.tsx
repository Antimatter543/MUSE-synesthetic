import React from 'react';
import { ConnectionStatus } from '../types/events';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  isListening: boolean;
  isCameraOn: boolean;
}

const statusConfig: Record<ConnectionStatus, { label: string; color: string; dot: string }> = {
  connected: { label: 'Connected', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  connecting: { label: 'Connecting...', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  disconnected: { label: 'Disconnected', color: 'text-muse-muted', dot: 'bg-muse-muted' },
  error: { label: 'Connection Error', color: 'text-red-400', dot: 'bg-red-400' },
};

export function StatusIndicator({ status, isListening, isCameraOn }: StatusIndicatorProps) {
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center gap-4 text-sm font-mono">
      {/* Connection */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${cfg.dot} ${
            status === 'connecting' ? 'animate-pulse' : ''
          }`}
        />
        <span className={cfg.color}>{cfg.label}</span>
      </div>

      {/* Mic */}
      <div className="flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-3.5 h-3.5 ${isListening ? 'text-muse-accent animate-pulse-slow' : 'text-muse-muted'}`}
        >
          <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
          <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
        </svg>
        <span className={isListening ? 'text-muse-accent' : 'text-muse-muted'}>
          {isListening ? 'Mic On' : 'Mic Off'}
        </span>
      </div>

      {/* Camera */}
      <div className="flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-3.5 h-3.5 ${isCameraOn ? 'text-muse-accent2' : 'text-muse-muted'}`}
        >
          <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
        <span className={isCameraOn ? 'text-muse-accent2' : 'text-muse-muted'}>
          {isCameraOn ? 'Camera On' : 'Camera Off'}
        </span>
      </div>
    </div>
  );
}
