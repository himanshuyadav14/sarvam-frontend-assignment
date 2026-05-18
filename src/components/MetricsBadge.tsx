import React from 'react';
import type { MetricsBadgeProps } from '../types';
import { formatTPS, formatDuration } from '../lib/mockBackend';

interface MetricItemProps {
  label: string;
  value: string;
  unit?: string;
  isLive?: boolean;
  icon: React.ReactNode;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, isLive, icon }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '14px 16px',
      borderRadius: '10px',
      background: isLive ? 'rgba(124,58,237,0.06)' : 'var(--color-bg-overlay)',
      border: `1px solid ${isLive ? 'rgba(124,58,237,0.2)' : 'var(--color-border-subtle)'}`,
      flex: 1,
      minWidth: 0,
      transition: 'all 0.3s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: isLive ? 'var(--color-text-accent)' : 'var(--color-text-muted)', display: 'flex' }}>
        {icon}
      </span>
      <span style={{
        fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--color-text-muted)',
      }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
      <span style={{
        fontSize: '22px', fontWeight: '700',
        fontFamily: 'var(--font-mono)',
        color: isLive ? 'var(--color-text-accent)' : 'var(--color-text-primary)',
        letterSpacing: '-0.03em',
        transition: 'color 0.3s ease',
      }}>
        {value}
      </span>
      {unit && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{unit}</span>
      )}
    </div>
  </div>
);

export const MetricsBadge: React.FC<MetricsBadgeProps> = ({ metrics, status }) => {
  const isLive = status === 'streaming';
  const isComplete = status === 'complete';
  const showMetrics = status !== 'idle';

  if (!showMetrics) return null;

  return (
    <div
      className="glass-card"
      style={{ borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      role="region"
      aria-label="Inference metrics"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--color-text-muted)',
        }}>
          Metrics
        </span>

        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--color-success)',
              animation: 'pulse-dot 1.4s ease-in-out infinite',
            }} aria-hidden="true" />
            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '500' }}>Live</span>
          </div>
        )}
        {isComplete && (
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
            background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)',
            border: '1px solid rgba(16,185,129,0.25)', fontWeight: '500',
          }}>
            Final
          </span>
        )}
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <MetricItem
          label="Tokens"
          value={metrics.tokenCount.toLocaleString()}
          isLive={isLive}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="3" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="1" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="1" y="9" width="5" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          }
        />
        <MetricItem
          label="Tok/sec"
          value={formatTPS(metrics.tokensPerSecond)}
          isLive={isLive}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          }
        />
        <MetricItem
          label="Elapsed"
          value={formatDuration(metrics.elapsedMs)}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* TPS progress bar */}
      {(isLive || isComplete) && metrics.tokensPerSecond > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Throughput</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              max ~15 tok/s
            </span>
          </div>
          <div style={{
            height: '4px', borderRadius: '999px',
            background: 'var(--color-border-subtle)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min((metrics.tokensPerSecond / 15) * 100, 100)}%`,
              borderRadius: '999px',
              background: 'linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
};
