import React, { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  stream: MediaStream | null;
  isActive: boolean;
  className?: string;
}

export function CameraPreview({ stream, isActive, className = '' }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream && isActive) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream, isActive]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-muse-border bg-muse-surface ${className}`}
    >
      {isActive && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // mirror effect
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muse-muted gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-10 h-10 opacity-30"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">Camera Off</span>
        </div>
      )}

      {/* Live indicator */}
      {isActive && stream && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-md px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-white font-mono">LIVE</span>
        </div>
      )}
    </div>
  );
}
