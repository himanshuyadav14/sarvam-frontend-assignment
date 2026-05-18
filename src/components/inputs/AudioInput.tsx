import React, { useEffect, useRef, useState } from 'react';
import type { AudioInputProps } from '../../types';
import { formatDuration } from '../../lib/mockBackend';

const WaveBar: React.FC<{ delay: string }> = ({ delay }) => (
  <span
    className="inline-block w-0.5 rounded-full"
    style={{
      background: 'var(--color-accent-primary)',
      animation: `wave-bar 0.8s ease-in-out infinite ${delay}`,
      height: '4px',
    }}
    aria-hidden="true"
  />
);

export const AudioInput: React.FC<AudioInputProps> = ({
  state,
  onStart,
  onStop,
  onClear,
  disabled,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (state.status === 'recording') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedMs(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status]);

  const isRecording = state.status === 'recording';
  const isReady = state.status === 'ready';
  const isIdle = state.status === 'idle';

  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Audio recording controls">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Audio Input
      </label>

      {/* Main recording area */}
      <div
        className="flex flex-col items-center gap-4 rounded-xl p-6 transition-all duration-300"
        style={{
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${isRecording ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}`,
          boxShadow: isRecording ? '0 0 20px rgba(124, 58, 237, 0.15)' : 'none',
        }}
      >
        {/* Waveform visualizer */}
        <div
          className="flex items-end gap-0.5 h-8"
          role="img"
          aria-label={isRecording ? 'Audio waveform — recording in progress' : 'Audio waveform'}
        >
          {Array.from({ length: 20 }, (_, i) => (
            <WaveBar
              key={i}
              delay={isRecording ? `${(i * 0.04).toFixed(2)}s` : '0s'}
            />
          ))}
        </div>

        {/* Status display */}
        {isRecording && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span
              className="w-2.5 h-2.5 rounded-full animate-recording-pulse"
              style={{ background: 'var(--color-error)' }}
              aria-hidden="true"
            />
            <span
              className="text-sm font-medium tabular-nums"
              style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
              aria-live="polite"
              aria-label={`Recording duration: ${formatDuration(elapsedMs)}`}
            >
              {formatDuration(elapsedMs)}
            </span>
          </div>
        )}

        {isReady && state.audioUrl && (
          <div className="w-full flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M3.5 6L5 7.5L8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Audio ready · {formatDuration(state.durationMs)}
              </span>
              <button
                onClick={onClear}
                disabled={disabled}
                aria-label="Clear audio recording"
                className="text-xs px-2 py-0.5 rounded transition-all duration-150 cursor-pointer"
                style={{
                  color: 'var(--color-text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-error)';
                  e.currentTarget.style.borderColor = 'var(--color-error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              >
                Clear
              </button>
            </div>
            <audio
              src={state.audioUrl}
              controls
              className="w-full h-8"
              aria-label="Recorded audio playback"
              style={{ borderRadius: '6px', accentColor: 'var(--color-accent-primary)' }}
            />
          </div>
        )}

        {isIdle && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Click Record to start capturing audio
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            id="record-btn"
            onClick={onStart}
            disabled={disabled || isReady}
            aria-label="Start audio recording"
            aria-pressed={false}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer"
            style={{
              minHeight: '56px',
              padding: '14px 20px',
              fontSize: '15px',
              background: disabled || isReady ? 'var(--color-bg-elevated)' : 'var(--color-accent-primary)',
              color: disabled || isReady ? 'var(--color-text-muted)' : 'white',
              border: 'none',
              opacity: disabled ? 0.5 : 1,
              boxShadow: disabled || isReady ? 'none' : '0 4px 16px rgba(124, 58, 237, 0.35)',
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isReady)
                e.currentTarget.style.background = 'var(--color-accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isReady)
                e.currentTarget.style.background = 'var(--color-accent-primary)';
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: disabled || isReady ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.8)' }}
              aria-hidden="true"
            />
            Record
          </button>
        ) : (
          <button
            id="stop-record-btn"
            onClick={onStop}
            aria-label="Stop audio recording"
            aria-pressed={true}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer"
            style={{
              minHeight: '56px',
              padding: '14px 20px',
              fontSize: '15px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm animate-recording-pulse"
              style={{ background: 'var(--color-error)' }}
              aria-hidden="true"
            />
            Stop Recording
          </button>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Microphone access required · Audio is processed locally
      </p>
    </div>
  );
};
