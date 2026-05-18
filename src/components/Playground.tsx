import React, { useCallback, useState } from 'react';
import type { InputMode } from '../types';
import { useStreaming } from '../hooks/useStreaming';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { InputModeToggle } from './controls/InputModeToggle';
import { TextInput } from './inputs/TextInput';
import { AudioInput } from './inputs/AudioInput';
import { GenerateButton } from './controls/GenerateButton';
import { StreamOutput } from './output/StreamOutput';
import { MetricsBadge } from './MetricsBadge';

const SAMPLE_PROMPTS = [
  { label: 'Attention mechanisms', text: 'Explain how transformer self-attention mechanisms work in large language models, including the role of query, key, and value matrices.' },
  { label: 'Sampling strategies', text: 'What is the difference between top-k and top-p (nucleus) sampling strategies for LLM inference? When should you use each?' },
  { label: 'Streaming inference', text: 'Describe how streaming inference reduces perceived latency in AI systems. How does server-sent events (SSE) enable token-by-token delivery?' },
];

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div
    className="animate-fade-in"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      minHeight: '320px',
      padding: '40px 24px',
      borderRadius: '16px',
      background: 'var(--color-bg-elevated)',
      border: '1px dashed var(--color-border-default)',
      textAlign: 'center',
    }}
  >
    {/* Icon */}
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
        border: '1px solid rgba(124,58,237,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path
          d="M13 3C7.477 3 3 7.477 3 13s4.477 10 10 10 10-4.477 10-10S18.523 3 13 3z"
          stroke="url(#empty-grad)"
          strokeWidth="1.5"
        />
        <path
          d="M9 13h8M13 9v8"
          stroke="url(#empty-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="empty-grad" x1="3" y1="3" x2="23" y2="23">
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
        Ready to generate
      </p>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '260px', lineHeight: '1.6' }}>
        Enter a prompt and click Generate to start streaming the AI response
      </p>
    </div>

    {/* Decorative dots */}
    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-border-emphasis)',
            animation: `pulse-dot 1.8s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const OutputSkeleton: React.FC = () => (
  <div
    className="animate-fade-in"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '24px',
      borderRadius: '16px',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      minHeight: '200px',
    }}
    role="status"
    aria-label="Loading response…"
    aria-live="polite"
  >
    {/* Shimmer lines */}
    {[95, 88, 100, 72, 90, 60].map((w, i) => (
      <div
        key={i}
        className="skeleton"
        style={{ height: '14px', width: `${w}%`, borderRadius: '4px' }}
      />
    ))}
    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
      <div className="animate-spin" style={{
        width: '12px', height: '12px', borderRadius: '50%',
        border: '2px solid rgba(124,58,237,0.3)',
        borderTopColor: 'var(--color-accent-primary)',
      }} />
      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
        Model is generating…
      </span>
    </div>
  </div>
);

// ─── Main Playground ──────────────────────────────────────────────────────────
export const Playground: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('text');
  const [prompt, setPrompt] = useState('');

  const { state: streamState, startStream, abortStream, reset } = useStreaming();
  const {
    state: recorderState,
    startRecording,
    stopRecording,
    clearRecording,
    error: audioError,
  } = useAudioRecorder();

  const isStreaming = streamState.status === 'streaming';
  const isLoading = isStreaming && streamState.output.length < 5;
  const hasOutput = streamState.output.length > 0;
  const showEmptyState = !hasOutput && streamState.status === 'idle';

  const canGenerate =
    !isStreaming &&
    ((mode === 'text' && prompt.trim().length > 0) ||
      (mode === 'audio' && recorderState.status === 'ready'));

  const handleGenerate = useCallback(() => {
    if (mode === 'text') {
      startStream(prompt.trim());
    } else {
      startStream(`[Audio input — ${(recorderState.durationMs / 1000).toFixed(1)}s recorded]`);
    }
  }, [mode, prompt, recorderState.durationMs, startStream]);

  const handleRetry = useCallback(() => {
    if (mode === 'text' && prompt.trim()) {
      startStream(prompt.trim());
    } else if (mode === 'audio' && recorderState.status === 'ready') {
      startStream(`[Audio input — ${(recorderState.durationMs / 1000).toFixed(1)}s recorded]`);
    }
  }, [mode, prompt, recorderState.status, recorderState.durationMs, startStream]);

  const handleModeChange = useCallback((newMode: InputMode) => {
    if (isStreaming) return;
    setMode(newMode);
    reset();
  }, [isStreaming, reset]);

  return (
    <main
      id="main-content"
      aria-label="Inference playground"
      style={{ width: '100%', maxWidth: '1160px', padding: '28px 20px 48px', flex: 1 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Mode toggle ── */}
        <div className="glass-card" style={{ borderRadius: '14px', padding: '6px' }}>
          <InputModeToggle mode={mode} onChange={handleModeChange} disabled={isStreaming} />
        </div>

        {/* ── Two-column layout ── */}
        <div className="playground-layout">

          {/* ─ Left: Input column ─ */}
          <div className="input-column">

            {/* Input card */}
            <div className="glass-card animate-fade-in" style={{ borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'text' ? (
                <>
                  <TextInput value={prompt} onChange={setPrompt} disabled={isStreaming} />

                  {/* Sample prompts */}
                  {!isStreaming && prompt.length === 0 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Try an example
                      </p>
                      {SAMPLE_PROMPTS.map(({ label, text }, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(text)}
                          aria-label={`Use sample: ${label}`}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '12px 14px',
                            background: 'var(--color-bg-overlay)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
                            e.currentTarget.style.background = 'rgba(124,58,237,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                            e.currentTarget.style.background = 'var(--color-bg-overlay)';
                          }}
                        >
                          <span style={{ color: 'var(--color-accent-primary)', marginTop: '1px', fontSize: '12px', flexShrink: 0 }}>↗</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{label}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{text.slice(0, 72)}…</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AudioInput
                    state={recorderState}
                    onStart={startRecording}
                    onStop={stopRecording}
                    onClear={clearRecording}
                    disabled={isStreaming}
                  />
                  {audioError && (
                    <div role="alert" className="animate-fade-in" style={{
                      padding: '12px 14px', borderRadius: '10px', fontSize: '12px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                      color: 'var(--color-error)', display: 'flex', gap: '8px', alignItems: 'flex-start',
                    }}>
                      <span style={{ flexShrink: 0, fontSize: '14px' }}>⚠</span>
                      {audioError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Generate / Stop button */}
            <GenerateButton
              onClick={handleGenerate}
              onAbort={abortStream}
              status={streamState.status}
              disabled={!canGenerate}
            />

            {/* Status hint */}
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {isStreaming
                ? 'Streaming tokens at ~100ms intervals'
                : 'Mock backend · LLM response simulation'}
            </p>
          </div>

          {/* ─ Right: Output column ─ */}
          <div className="output-column">

            {/* Sticky metrics */}
            {streamState.status !== 'idle' && (
              <div className="metrics-sticky animate-slide-down">
                <MetricsBadge metrics={streamState.metrics} status={streamState.status} />
              </div>
            )}

            {/* Output area */}
            {showEmptyState ? (
              <EmptyState />
            ) : isLoading ? (
              <OutputSkeleton />
            ) : (
              <div className="animate-fade-in">
                <StreamOutput
                  output={streamState.output}
                  status={streamState.status}
                  error={streamState.error}
                  onRetry={handleRetry}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
