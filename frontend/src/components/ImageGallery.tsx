import React, { useState, useEffect, useRef } from 'react';
import { GalleryEntry } from '../types/events';

interface ImageGalleryProps {
  entries: GalleryEntry[];
}

function GalleryImage({ entry, onClick }: { entry: GalleryEntry; onClick: () => void }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  // Fade in on mount (new images animate in)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const src = entry.image_b64
    ? `data:image/jpeg;base64,${entry.image_b64}`
    : entry.image_url || '';

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.92)' }}
      className="relative aspect-square rounded-lg overflow-hidden border border-muse-border hover:border-muse-accent transition-all duration-500 group"
    >
      <img src={src} alt={entry.prompt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
        <p className="text-xs text-white line-clamp-2">{entry.prompt}</p>
      </div>
      <div className="absolute top-1.5 left-1.5">
        <span className="text-xs bg-black/60 rounded px-1.5 py-0.5 text-muse-accent capitalize">
          {entry.mode}
        </span>
      </div>
    </button>
  );
}

export function ImageGallery({ entries }: ImageGalleryProps) {
  const [selected, setSelected] = useState<GalleryEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muse-muted gap-3 py-8">
        <div className="text-4xl opacity-30">🎨</div>
        <p className="text-sm italic">Generated art will appear here...</p>
      </div>
    );
  }

  const selectedSrc = selected
    ? selected.image_b64
      ? `data:image/jpeg;base64,${selected.image_b64}`
      : selected.image_url || ''
    : '';

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto">
        {entries.map((entry) => (
          <GalleryImage key={entry.id} entry={entry} onClick={() => setSelected(entry)} />
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-muse-surface rounded-2xl overflow-hidden max-w-lg w-full border border-muse-accent/30 shadow-2xl shadow-muse-accent/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedSrc} alt={selected.prompt} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <p className="text-sm text-muse-text leading-relaxed">{selected.prompt}</p>
              {selected.poem && (
                <pre className="mt-3 text-xs text-muse-muted font-mono whitespace-pre-wrap border-l-2 border-muse-accent pl-3">
                  {selected.poem}
                </pre>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muse-muted capitalize">{selected.mode} mode</span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-muse-muted hover:text-muse-text"
                >
                  Close ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
