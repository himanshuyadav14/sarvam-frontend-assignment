import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { StreamOutputProps } from '../../types';
import { getErrorIcon } from '../../lib/mockBackend';

// ─── Copy Button with confirmation ────────────────────────────────────────────
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: ignore */ }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy output to clipboard'}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 10px', borderRadius: '7px', cursor: 'pointer',
        fontSize: '11px', fontWeight: '500',
        color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
        background: copied ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-overlay)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--color-border-subtle)'}`,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.color = 'var(--color-text-primary)';
          e.currentTarget.style.borderColor = 'var(--color-border-emphasis)';
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
        }
      }}
    >
      {copied ? (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <rect x="3" y="1" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="3" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" fill="var(--color-bg-elevated)" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StreamOutputProps['status'] }> = ({ status }) => {
  if (status === 'streaming') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '3px' }}>
        {[0, 150, 300].map((delay) => (
          <span key={delay} style={{
            width: '4px', height: '4px', borderRadius: '50%',
            background: 'var(--color-accent-secondary)',
            animation: `pulse-dot 1.2s ease-in-out ${delay}ms infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--color-accent-secondary)', fontWeight: '500' }}>
        Streaming
      </span>
    </div>
  );

  if (status === 'complete') return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="5" fill="rgba(16,185,129,0.15)" stroke="var(--color-success)" strokeWidth="1" />
        <path d="M3.5 6l1.5 1.5L8.5 4" stroke="var(--color-success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '500' }}>Complete</span>
    </div>
  );

  if (status === 'aborted') return (
    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Stopped</span>
  );

  if (status === 'error') return (
    <span style={{ fontSize: '11px', color: 'var(--color-error)' }}>Failed</span>
  );

  return null;
};

// ─── Main StreamOutput ────────────────────────────────────────────────────────
export const StreamOutput: React.FC<StreamOutputProps> = ({
  output, status, error, onRetry,
}) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [showJumpBtn, setShowJumpBtn] = useState(false);

  const isStreaming = status === 'streaming';
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const hasOutput = output.length > 0;

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
      setIsUserScrolled(false);
      setShowJumpBtn(false);
    }
  }, []);

  // Track if user manually scrolled up
  const handleScroll = useCallback(() => {
    if (!outputRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsUserScrolled(!isNearBottom);
    setShowJumpBtn(!isNearBottom && isStreaming);
  }, [isStreaming]);

  // Auto-scroll when new tokens arrive (if user hasn't scrolled up)
  useEffect(() => {
    if (isStreaming && !isUserScrolled && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isStreaming, isUserScrolled]);

  // Hide jump button when streaming ends
  useEffect(() => {
    if (!isStreaming) setShowJumpBtn(false);
  }, [isStreaming]);

  if (!hasOutput && !isError) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : isComplete ? 'rgba(16,185,129,0.2)' : 'var(--color-border-default)'}`, transition: 'border-color 0.4s ease' }}>

      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
            Output
          </span>
          <StatusBadge status={status} />
        </div>
        {hasOutput && <CopyButton text={output} />}
      </div>

      {/* ── Completion banner ── */}
      {isComplete && (
        <div
          className="animate-slide-down"
          style={{
            padding: '10px 16px',
            background: 'rgba(16,185,129,0.06)',
            borderBottom: '1px solid rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
          role="status"
          aria-live="polite"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" fill="rgba(16,185,129,0.15)" stroke="var(--color-success)" strokeWidth="1.2" />
            <path d="M4 7l2 2 4-4" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '500' }}>
            Generation complete
          </span>
        </div>
      )}

      {/* ── Streaming content ── */}
      <div style={{ position: 'relative' }}>
        <div
          ref={outputRef}
          id="stream-output"
          role="region"
          aria-label="AI response output"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions text"
          tabIndex={0}
          onScroll={handleScroll}
          style={{
            minHeight: '280px',
            maxHeight: '520px',
            overflowY: 'auto',
            padding: '20px',
            background: 'var(--color-bg-elevated)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '1.85',
            color: 'var(--color-text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {hasOutput
            ? <span className={isStreaming ? 'streaming-cursor' : ''}>{output}</span>
            : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No output before error.</span>
          }
        </div>

        {/* Jump to bottom button */}
        {showJumpBtn && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to latest tokens"
            className="animate-float-in-bottom"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'var(--color-accent-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Jump to bottom
          </button>
        )}
      </div>

      {/* ── Error banner ── */}
      {isError && error && (
        <div
          role="alert"
          aria-live="assertive"
          className="animate-slide-down"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(239,68,68,0.07)',
            borderTop: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
            {/* Icon */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
            }}>
              {getErrorIcon(error.type)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-error)' }}>
                {error.type.charAt(0).toUpperCase() + error.type.slice(1)} Error
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                {error.message}
              </span>
              {hasOutput && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  ↑ Partial output preserved above
                </span>
              )}
            </div>
          </div>

          {error.retryable && (
            <button
              onClick={onRetry}
              aria-label="Retry the request"
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
                background: 'rgba(239,68,68,0.12)',
                color: 'var(--color-error)',
                border: '1px solid rgba(239,68,68,0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <path d="M9 5.5A3.5 3.5 0 115.5 2M5.5 2L7 3.5M5.5 2L4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};
