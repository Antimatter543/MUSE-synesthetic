import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusIndicator } from '../components/StatusIndicator'
import { ModeSelector } from '../components/ModeSelector'
import { TranscriptPanel } from '../components/TranscriptPanel'
import { WaveformVisualizer } from '../components/WaveformVisualizer'
import { ImageGallery } from '../components/ImageGallery'

describe('StatusIndicator', () => {
  it('shows connected status', () => {
    render(<StatusIndicator status="connected" isListening={false} isCameraOn={false} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows mic on when listening', () => {
    render(<StatusIndicator status="connected" isListening={true} isCameraOn={false} />)
    expect(screen.getByText('Mic On')).toBeInTheDocument()
  })

  it('shows camera on when active', () => {
    render(<StatusIndicator status="connected" isListening={false} isCameraOn={true} />)
    expect(screen.getByText('Camera On')).toBeInTheDocument()
  })
})

describe('ModeSelector', () => {
  it('renders all 4 modes', () => {
    render(<ModeSelector mode="visual" onModeChange={vi.fn()} />)
    expect(screen.getByText('Visual')).toBeInTheDocument()
    expect(screen.getByText('Audio')).toBeInTheDocument()
    expect(screen.getByText('Environ')).toBeInTheDocument()
    expect(screen.getByText('Sketch')).toBeInTheDocument()
  })

  it('calls onModeChange when a mode is clicked', () => {
    const onChange = vi.fn()
    render(<ModeSelector mode="visual" onModeChange={onChange} />)
    fireEvent.click(screen.getByText('Audio'))
    expect(onChange).toHaveBeenCalledWith('audio')
  })

  it('does not call onModeChange when disabled', () => {
    const onChange = vi.fn()
    render(<ModeSelector mode="visual" onModeChange={onChange} disabled />)
    fireEvent.click(screen.getByText('Audio'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('TranscriptPanel', () => {
  it('shows placeholder when empty', () => {
    render(<TranscriptPanel lines={[]} />)
    expect(screen.getByText('MUSE is listening...')).toBeInTheDocument()
  })

  it('renders transcript lines', () => {
    const lines = [
      { id: '1', text: 'Hello MUSE', role: 'user' as const, timestamp: Date.now() },
      { id: '2', text: 'I see colors in your voice', role: 'assistant' as const, timestamp: Date.now() },
    ]
    render(<TranscriptPanel lines={lines} />)
    expect(screen.getByText('Hello MUSE')).toBeInTheDocument()
    expect(screen.getByText('I see colors in your voice')).toBeInTheDocument()
  })
})

describe('WaveformVisualizer', () => {
  it('renders correct number of bars', () => {
    const { container } = render(<WaveformVisualizer audioLevel={0} isActive={false} bars={10} />)
    const bars = container.querySelectorAll('.w-1')
    expect(bars).toHaveLength(10)
  })
})

describe('ImageGallery', () => {
  it('shows empty state when no entries', () => {
    render(<ImageGallery entries={[]} />)
    expect(screen.getByText('Generated art will appear here...')).toBeInTheDocument()
  })

  it('renders gallery entries', () => {
    const entries = [{
      id: '1',
      session_id: 'test',
      image_b64: btoa('fake-image'),
      prompt: 'A crimson melody',
      mode: 'visual' as const,
      created_at: new Date().toISOString(),
    }]
    render(<ImageGallery entries={entries} />)
    expect(screen.getByAltText('A crimson melody')).toBeInTheDocument()
  })
})
