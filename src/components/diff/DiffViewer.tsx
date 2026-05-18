import React, { useMemo, useState } from 'react';
import { computeDiff } from '../../utils/diff';
import { DiffPanel } from './DiffPanel';

const PLACEHOLDER_A = `Large language models work by predicting the next token in a sequence given all preceding tokens. The attention mechanism allows each token to attend to all other tokens in the context window.`;

const PLACEHOLDER_B = `Large language models operate by predicting the next word in a sequence given all previous words. The self-attention mechanism allows each token to selectively attend to relevant tokens in the context window.`;

/**
 * DiffViewer — Side-by-side token-level diff component.
 *
 * Architecture:
 *   - Two controlled textareas for Model A / Model B input
 *   - computeDiff() is memoized on input changes (no unnecessary recomputation)
 *   - DiffPanel renders each side with colored TokenSpan elements
 *   - Stats bar shows similarity score and token counts
 */
export const DiffViewer: React.FC = () => {
  const [textA, setTextA] = useState(PLACEHOLDER_A);
  const [textB, setTextB] = useState(PLACEHOLDER_B);

  // Memoize the diff computation — O(m×n) DP only reruns when inputs change
  const diffResult = useMemo(() => computeDiff(textA, textB), [textA, textB]);

  const { stats } = diffResult;
  const similarityPct = Math.round(stats.similarity * 100);

  const similarityColor =
    similarityPct >= 80
      ? '#10b981'
      : similarityPct >= 50
      ? '#f59e0b'
      : '#ef4444';

  const hasContent = textA.trim().length > 0 || textB.trim().length > 0;

  return (
    <main
      id="diff-main"
      aria-label="Token diff viewer"
      style={{
        width: '100%',
        maxWidth: '1100px',
        padding: '40px 24px',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Page title ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Token-Level Diff Viewer
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            LCS-based · Whitespace tokenization · No external libraries
          </p>
        </div>

        {/* ── Input textareas ──────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <TextareaInput
            id="model-a-input"
            label="Model A Output"
            accentColor="#7c3aed"
            value={textA}
            onChange={setTextA}
            placeholder="Paste Model A output here…"
          />
          <TextareaInput
            id="model-b-input"
            label="Model B Output"
            accentColor="#06b6d4"
            value={textB}
            onChange={setTextB}
            placeholder="Paste Model B output here…"
          />
        </div>

        {/* ── Stats bar ────────────────────────────────────────────── */}
        {hasContent && (
          <div
            role="region"
            aria-label="Diff statistics"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              flexWrap: 'wrap',
            }}
          >
            {/* Similarity bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                Similarity
              </span>
              <div
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '999px',
                  background: 'var(--color-bg-base)',
                  overflow: 'hidden',
                  minWidth: '80px',
                }}
                role="progressbar"
                aria-valuenow={similarityPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Similarity: ${similarityPct}%`}
              >
                <div
                  style={{
                    width: `${similarityPct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: similarityColor,
                    transition: 'width 0.4s ease, background 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: similarityColor,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}
              >
                {similarityPct}%
              </span>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatPill label="Unchanged" value={stats.equalCount} color="#9090b0" />
              <StatPill label="Removed" value={stats.deleteCount} color="#ef4444" />
              <StatPill label="Added" value={stats.insertCount} color="#10b981" />
            </div>
          </div>
        )}

        {/* ── Legend ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Legend
          </span>
          <LegendItem label="Unchanged" bg="transparent" color="var(--color-text-primary)" border="none" />
          <LegendItem label="Removed (A only)" bg="rgba(239,68,68,0.18)" color="#fca5a5" border="none" strikethrough />
          <LegendItem label="Added (B only)" bg="rgba(16,185,129,0.18)" color="#6ee7b7" border="none" />
        </div>

        {/* ── Side-by-side diff panels ─────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <DiffPanel
            title="Model A"
            subtitle="Deletions highlighted in red"
            tokens={diffResult.left}
            accentColor="#7c3aed"
            isEmpty={textA.trim().length === 0}
            tokenCount={stats.totalA}
          />
          <DiffPanel
            title="Model B"
            subtitle="Insertions highlighted in green"
            tokens={diffResult.right}
            accentColor="#06b6d4"
            isEmpty={textB.trim().length === 0}
            tokenCount={stats.totalB}
          />
        </div>

        {/* ── Algorithm note ───────────────────────────────────────── */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(124,58,237,0.05)',
            border: '1px solid rgba(124,58,237,0.15)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: '1.6',
          }}
          role="note"
        >
          <strong style={{ color: 'var(--color-text-secondary)' }}>Algorithm:</strong>{' '}
          LCS (Longest Common Subsequence) via dynamic programming · O(m×n) time · O(m×n) space ·
          Whitespace tokenization · Sørensen–Dice similarity coefficient
        </div>
      </div>
    </main>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TextareaInputProps {
  id: string;
  label: string;
  accentColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

const TextareaInput: React.FC<TextareaInputProps> = ({
  id,
  label,
  accentColor,
  value,
  onChange,
  placeholder,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label
      htmlFor={id}
      style={{
        fontSize: '13px',
        fontWeight: '600',
        color: accentColor,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      style={{
        width: '100%',
        padding: '14px 16px',
        fontSize: '13px',
        lineHeight: '1.7',
        fontFamily: 'var(--font-sans)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: '12px',
        color: 'var(--color-text-primary)',
        outline: 'none',
        resize: 'vertical',
        caretColor: accentColor,
        boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = accentColor;
        e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--color-border-default)';
        e.target.style.boxShadow = 'none';
      }}
      aria-label={`${label} input`}
    />
    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
      {value.trim().split(/\s+/).filter(Boolean).length} tokens
    </span>
  </div>
);

interface StatPillProps {
  label: string;
  value: number;
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ label, value, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '999px',
      background: `${color}12`,
      border: `1px solid ${color}30`,
    }}
  >
    <span
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{label}</span>
    <span
      style={{
        fontSize: '12px',
        fontWeight: '700',
        color,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {value}
    </span>
  </div>
);

interface LegendItemProps {
  label: string;
  bg: string;
  color: string;
  border: string;
  strikethrough?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({ label, bg, color, border, strikethrough }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span
      style={{
        background: bg,
        color,
        border,
        padding: '1px 6px',
        borderRadius: '3px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        textDecoration: strikethrough ? 'line-through' : 'none',
      }}
    >
      token
    </span>
    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
  </div>
);
