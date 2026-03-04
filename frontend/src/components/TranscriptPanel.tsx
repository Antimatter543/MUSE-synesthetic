import React, { useEffect, useRef } from 'react';
import { TranscriptLine } from '../types/events';

interface TranscriptPanelProps {
  lines: TranscriptLine[];
}

export function TranscriptPanel({ lines }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 scrollbar-thin">
      {lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muse-muted text-sm italic">
          MUSE is listening...
        </div>
      ) : (
        lines.map((line) => (
          <div
            key={line.id}
            className={`flex gap-2 ${
              line.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`
                max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed
                ${
                  line.role === 'assistant'
                    ? 'bg-muse-panel border border-muse-border text-muse-text'
                    : 'bg-muse-accent/20 border border-muse-accent/30 text-muse-accent ml-auto'
                }
              `}
            >
              {line.role === 'assistant' && (
                <div className="text-xs text-muse-muted mb-1 font-mono">MUSE</div>
              )}
              <p>{line.text}</p>
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
