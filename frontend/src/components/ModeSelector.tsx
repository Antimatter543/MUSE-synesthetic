import React from 'react';
import { MuseMode } from '../types/events';

interface ModeSelectorProps {
  mode: MuseMode;
  onModeChange: (mode: MuseMode) => void;
  disabled?: boolean;
}

const modes: { id: MuseMode; label: string; icon: string; desc: string }[] = [
  { id: 'visual', label: 'Visual', icon: '🎨', desc: 'See → Sound/Art' },
  { id: 'audio', label: 'Audio', icon: '🎵', desc: 'Sound → Vision' },
  { id: 'environment', label: 'Environ', icon: '🌍', desc: 'Explore → Story' },
  { id: 'sketch', label: 'Sketch', icon: '✏️', desc: 'Draw → Refine' },
];

export function ModeSelector({ mode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => !disabled && onModeChange(m.id)}
          title={m.desc}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200 border
            ${
              mode === m.id
                ? 'bg-muse-accent/20 border-muse-accent text-muse-accent'
                : 'bg-muse-surface border-muse-border text-muse-muted hover:text-muse-text hover:border-muse-accent/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
