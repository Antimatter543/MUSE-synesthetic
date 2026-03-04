import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock browser APIs not available in jsdom
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: class MockAudioContext {
    state = 'running'
    sampleRate = 48000
    audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) }
    createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() })
    close = vi.fn()
    resume = vi.fn().mockResolvedValue(undefined)
  },
})

Object.defineProperty(window, 'AudioWorkletNode', {
  writable: true,
  value: class MockAudioWorkletNode {
    port = { onmessage: null, postMessage: vi.fn() }
    connect = vi.fn()
    disconnect = vi.fn()
  },
})

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [],
      getVideoTracks: () => [],
    }),
  },
})

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  static CLOSED = 3
  readyState = 1
  binaryType = 'arraybuffer'
  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  send = vi.fn()
  close = vi.fn()
  constructor(public url: string) {
    setTimeout(() => this.onopen?.(new Event('open')), 0)
  }
} as unknown as typeof WebSocket
