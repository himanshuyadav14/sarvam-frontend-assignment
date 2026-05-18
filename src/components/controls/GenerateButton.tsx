import React from 'react';
import type { GenerateButtonProps } from '../../types';

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  onAbort,
  status,
  disabled,
}) => {
  const isStreaming = status === 'streaming';
  const isComplete = status === 'complete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* ── Generate / Cancel row ── */}
      <div style={{ display: 'flex', gap: '8px' }}>

        {/* Generate button */}
        <button
          id="generate-btn"
          onClick={isStreaming ? undefined : onClick}
          disabled={(disabled && !isStreaming) || isStreaming}
          aria-label={isStreaming ? 'Generating…' : 'Generate response'}
          aria-busy={isStreaming}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px',
            minHeight: '52px',
            padding: '13px 20px',
            borderRadius: '12px',
            fontSize: '14px', fontWeight: '600',
            cursor: isStreaming || disabled ? 'not-allowed' : 'pointer',
            border: 'none',
            transition: 'all 0.2s ease',
            background: isStreaming
              ? 'var(--color-bg-overlay)'
              : disabled
              ? 'var(--color-bg-elevated)'
              : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            color: isStreaming
              ? 'var(--color-text-muted)'
              : disabled
              ? 'var(--color-text-muted)'
              : 'white',
            boxShadow: isStreaming || disabled
              ? 'none'
              : '0 4px 18px rgba(124,58,237,0.4)',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isStreaming) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isStreaming || disabled ? 'none' : '0 4px 18px rgba(124,58,237,0.4)';
          }}
          onMouseDown={(e) => {
            if (!disabled && !isStreaming) e.currentTarget.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e) => {
            if (!disabled && !isStreaming) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
        >
          {isStreaming ? (
            <>
              {/* Three-dot loading animation */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 150, 300].map((delay) => (
                  <span key={delay} style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--color-text-muted)',
                    animation: `pulse-dot 1.1s ease-in-out ${delay}ms infinite`,
                  }} />
                ))}
              </div>
              <span>Generating</span>
            </>
          ) : (
            <>
              {!disabled && (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M2.5 7.5L7.5 2.5M2.5 7.5L7.5 12.5M2.5 7.5H12.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              Generate
            </>
          )}
        </button>

        {/* Cancel button — only shown while streaming */}
        {isStreaming && (
          <button
            id="cancel-btn"
            onClick={onAbort}
            aria-label="Cancel generation"
            className="animate-scale-in"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px',
              minHeight: '52px',
              padding: '13px 18px',
              borderRadius: '12px',
              fontSize: '13px', fontWeight: '600',
              cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239,68,68,0.3)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Stop
          </button>
        )}
      </div>

      {/* Completion state hint */}
      {isComplete && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', borderRadius: '8px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="var(--color-success)" strokeWidth="1.2" />
            <path d="M3.5 6l2 2L8.5 4" stroke="var(--color-success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>
            Done — run again to generate a new response
          </span>
        </div>
      )}
    </div>
  );
};
