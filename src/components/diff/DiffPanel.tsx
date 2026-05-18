import React from 'react';
import type { DiffToken } from '../../utils/diff';
import { TokenSpan } from './TokenSpan';

interface DiffPanelProps {
  title: string;
  subtitle: string;
  tokens: DiffToken[];
  accentColor: string;
  isEmpty: boolean;
  tokenCount: number;
}

/**
 * A single side of the diff viewer.
 * Renders a labeled panel with all tokens color-coded by their diff type.
 */
export const DiffPanel: React.FC<DiffPanelProps> = ({
  title,
  subtitle,
  tokens,
  accentColor,
  isEmpty,
  tokenCount,
}) => {
  const highlightCount = tokens.filter((t) => t.type !== 'equal').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '10px',
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: accentColor,
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: 'var(--color-bg-base)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tokenCount} tokens
          </span>
          {highlightCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}35`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {highlightCount} changed
            </span>
          )}
        </div>
      </div>

      {/* Token output area */}
      <div
        role="region"
        aria-label={`${title} diff output`}
        tabIndex={0}
        style={{
          flex: 1,
          minHeight: '280px',
          maxHeight: '420px',
          overflowY: 'auto',
          padding: '18px 20px',
          borderRadius: '12px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13.5px',
          lineHeight: '1.9',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {isEmpty ? (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>
            Enter text above to see the diff…
          </span>
        ) : tokens.length === 0 ? (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>
            No tokens
          </span>
        ) : (
          tokens.map((dt, i) => (
            <TokenSpan
              key={`${dt.type}-${i}-${dt.token}`}
              token={dt.token}
              type={dt.type}
              isLast={i === tokens.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
};
