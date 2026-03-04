import React, { useCallback, useEffect, useState } from 'react';
import { CameraPreview } from './components/CameraPreview';
import { ImageGallery } from './components/ImageGallery';
import { ModeSelector } from './components/ModeSelector';
import { StatusIndicator } from './components/StatusIndicator';
import { TranscriptPanel } from './components/TranscriptPanel';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { useAudioCapture } from './hooks/useAudioCapture';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useCameraCapture } from './hooks/useCameraCapture';
import { useWebSocket } from './hooks/useWebSocket';
import {
  GalleryEntry,
  ImageGeneratedEvent,
  MuseEvent,
  MuseMode,
  TranscriptLine,
} from './types/events';

// Generate a stable session ID for this browser tab
const SESSION_ID = `muse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const [mode, setMode] = useState<MuseMode>('visual');
  const [isListening, setIsListening] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'transcript' | 'gallery'>('transcript');
  const [isCreatingArt, setIsCreatingArt] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const { playAudio, initialize: initAudio } = useAudioPlayback();

  // Handle events from backend
  const handleEvent = useCallback((event: MuseEvent) => {
    switch (event.type) {
      case 'connected':
        addTranscriptLine('MUSE is ready. Show me something beautiful.', 'assistant');
        break;

      case 'transcript':
        addTranscriptLine(event.text, event.role);
        break;

      case 'generating_image':
        setIsCreatingArt(true);
        setActiveTab('gallery');
        break;

      case 'image_generated': {
        setIsCreatingArt(false);
        const imgEvent = event as ImageGeneratedEvent;
        const entry: GalleryEntry = {
          id: `img-${Date.now()}`,
          session_id: SESSION_ID,
          image_b64: imgEvent.image_b64,
          prompt: imgEvent.prompt,
          mode,
          created_at: new Date().toISOString(),
        };
        setGallery((prev) => [entry, ...prev]);
        setActiveTab('gallery');
        break;
      }

      case 'gallery_updated':
        // Image saved to cloud — update URL if we have the entry
        setGallery((prev) =>
          prev.map((e) =>
            e.id === event.entry_id ? { ...e, image_url: event.image_url } : e
          )
        );
        break;

      case 'error':
        console.error('MUSE error:', event.message);
        break;
    }
  }, [mode]);

  // Handle incoming audio
  const handleAudio = useCallback(
    (audioBuffer: ArrayBuffer) => {
      playAudio(audioBuffer);
    },
    [playAudio]
  );

  const { status, sendBinary, sendJSON, connect, disconnect } = useWebSocket({
    sessionId: SESSION_ID,
    onEvent: handleEvent,
    onAudio: handleAudio,
  });

  // Mic capture → send PCM to backend
  const { audioLevel } = useAudioCapture({
    enabled: isListening,
    onPCMChunk: sendBinary,
  });

  // Camera capture → send frames to backend
  const { stream: cameraStream } = useCameraCapture({
    enabled: isCameraOn,
    onFrame: useCallback(
      (jpegB64: string) => {
        sendJSON({ type: 'video_frame', data: jpegB64 });
      },
      [sendJSON]
    ),
  });


  // Mode change → notify backend
  const handleModeChange = useCallback(
    (newMode: MuseMode) => {
      setMode(newMode);
      sendJSON({ type: 'mode_change', mode: newMode });
    },
    [sendJSON]
  );

  const addTranscriptLine = (text: string, role: 'user' | 'assistant') => {
    setTranscript((prev) => {
      // Deduplicate consecutive identical messages (e.g. from React StrictMode double-mount)
      if (prev.length > 0 && prev[prev.length - 1].text === text && prev[prev.length - 1].role === role) {
        return prev;
      }
      return [...prev, { id: `${Date.now()}-${Math.random()}`, text, role, timestamp: Date.now() }];
    });
  };

  useEffect(() => {
    if (!pendingStart || status !== 'connected') return;

    let cancelled = false;

    (async () => {
      await initAudio();
      if (cancelled) return;
      setIsListening(true);
      setIsCameraOn(true);
      setPendingStart(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingStart, status, initAudio]);

  const handleStartSession = () => {
    if (status !== 'connected') {
      connect();
    }
    setPendingStart(true);
  };

  const handleStop = () => {
    setPendingStart(false);
    setIsListening(false);
    setIsCameraOn(false);
    disconnect();
  };

  const isActive = isListening || isCameraOn;

  return (
    <div className="min-h-screen bg-muse-bg text-muse-text font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-muse-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muse-accent to-muse-accent2 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <h1 className="text-base font-semibold text-muse-text">MUSE</h1>
            <p className="text-xs text-muse-muted">Multimodal Synesthetic Experience Engine</p>
          </div>
        </div>
        <StatusIndicator
          status={status}
          isListening={isListening}
          isCameraOn={isCameraOn}
        />
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left panel: Camera + Controls */}
        <div className="w-80 flex-shrink-0 border-r border-muse-border flex flex-col p-4 gap-4">
          {/* Camera preview */}
          <CameraPreview
            stream={cameraStream}
            isActive={isCameraOn}
            className="aspect-square"
          />

          {/* Waveform */}
          <div className="bg-muse-panel rounded-xl px-4 py-3 border border-muse-border">
            <p className="text-xs text-muse-muted mb-2 font-mono">Audio Input</p>
            <WaveformVisualizer audioLevel={audioLevel} isActive={isListening} />
          </div>

          {/* Mode selector */}
          <div>
            <p className="text-xs text-muse-muted mb-2 font-mono">Mode</p>
            <ModeSelector mode={mode} onModeChange={handleModeChange} disabled={!isActive} />
          </div>

          {/* Start/Stop */}
          <div className="mt-auto">
            {!isActive ? (
              <button
                onClick={handleStartSession}
                disabled={status === 'connecting' || pendingStart}
                className="w-full py-3 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-muse-accent to-muse-accent2
                  hover:opacity-90 transition-opacity
                  disabled:opacity-40 disabled:cursor-not-allowed
                  shadow-lg shadow-muse-accent/20"
              >
                {status === 'connecting' || pendingStart ? 'Connecting...' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-3 rounded-xl font-semibold text-white
                  bg-muse-surface border border-red-500/50 text-red-400
                  hover:bg-red-500/10 transition-colors"
              >
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Right panel: Transcript + Gallery */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-muse-border px-4">
            {(['transcript', 'gallery'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-muse-accent text-muse-accent'
                    : 'border-transparent text-muse-muted hover:text-muse-text'
                }`}
              >
                {tab}
                {tab === 'gallery' && isCreatingArt && (
                  <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-muse-accent animate-pulse" />
                )}
                {tab === 'gallery' && !isCreatingArt && gallery.length > 0 && (
                  <span className="ml-1.5 text-xs bg-muse-accent/20 text-muse-accent rounded-full px-1.5">
                    {gallery.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeTab === 'transcript' ? (
              <TranscriptPanel lines={transcript} />
            ) : (
              <>
                {isCreatingArt && (
                  <div className="flex items-center gap-2 mb-3 px-1 text-sm text-muse-accent animate-pulse">
                    <span>✦</span>
                    <span className="font-mono">MUSE is creating...</span>
                  </div>
                )}
                <ImageGallery entries={gallery} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
