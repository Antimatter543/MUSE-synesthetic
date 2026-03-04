import React, { useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  bars?: number;
}

export function WaveformVisualizer({
  audioLevel,
  isActive,
  bars = 20,
}: WaveformVisualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(() => Array(bars).fill(0.1));

  useEffect(() => {
    if (!isActive) {
      setBarHeights(Array(bars).fill(0.1));
      return;
    }
    setBarHeights((prev) => [
      ...prev.slice(1),
      Math.max(0.05, audioLevel + (Math.random() - 0.5) * 0.15),
    ]);
  }, [audioLevel, isActive, bars]);

  return (
    <div className="flex items-center gap-0.5 h-10">
      {barHeights.map((height, i) => {
        const hue = 260 + i * 4;
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, height * 40)}px`,
              background: `hsl(${hue}, 80%, 60%)`,
              opacity: isActive ? 0.8 + height * 0.2 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}
