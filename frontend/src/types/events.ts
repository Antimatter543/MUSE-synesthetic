export type MuseMode = 'visual' | 'audio' | 'environment' | 'sketch';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Events sent FROM backend TO frontend (JSON over WebSocket)
export interface ConnectedEvent {
  type: 'connected';
  session_id: string;
  message: string;
}

export interface TranscriptEvent {
  type: 'transcript';
  text: string;
  role: 'user' | 'assistant';
}

export interface ImageGeneratedEvent {
  type: 'image_generated';
  image_b64: string;
  prompt: string;
  style: string;
}

export interface GalleryUpdatedEvent {
  type: 'gallery_updated';
  entry_id: string;
  image_url: string;
}

export interface TurnCompleteEvent {
  type: 'turn_complete';
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export interface GeneratingImageEvent {
  type: 'generating_image';
}

export type MuseEvent =
  | ConnectedEvent
  | TranscriptEvent
  | ImageGeneratedEvent
  | GalleryUpdatedEvent
  | TurnCompleteEvent
  | ErrorEvent
  | GeneratingImageEvent;

// Gallery entry
export interface GalleryEntry {
  id: string;
  session_id: string;
  image_url?: string;
  image_b64?: string;
  prompt: string;
  mode: MuseMode;
  poem?: string;
  created_at: string;
}

// Transcript line
export interface TranscriptLine {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: number;
}
