import React from 'react';
import type { DiffType } from '../../utils/diff';

interface TokenSpanProps {
  token: string;
  type: DiffType;
  /** Optional: whether this is the last token (skip trailing space) */
  isLast?: boolean;
}

/**
 * Renders a single token with color coding based on its diff type.
 *
 * Visual language:
 *   equal  → default text, no background (unchanged)
 *   delete → red background with strikethrough (removed from A)
 *   insert → green background (added in B)
 */
export const TokenSpan: React.FC<TokenSpanProps> = ({ token, type, isLast = false }) => {
  const styles: Record<DiffType, React.CSSProperties> = {
    equal: {
      color: 'var(--color-text-primary)',
      background: 'transparent',
      borderRadius: '3px',
      padding: '1px 0',
    },
    delete: {
      color: '#fca5a5',
      background: 'rgba(239, 68, 68, 0.18)',
      borderRadius: '3px',
      padding: '1px 4px',
      textDecoration: 'line-through',
      textDecorationColor: 'rgba(239, 68, 68, 0.6)',
    },
    insert: {
      color: '#6ee7b7',
      background: 'rgba(16, 185, 129, 0.18)',
      borderRadius: '3px',
      padding: '1px 4px',
    },
  };

  return (
    <>
      <span
        style={styles[type]}
        aria-label={
          type === 'equal'
            ? token
            : type === 'delete'
            ? `removed: ${token}`
            : `added: ${token}`
        }
        title={type === 'equal' ? undefined : type === 'delete' ? 'Removed' : 'Added'}
      >
        {token}
      </span>
      {!isLast && ' '}
    </>
  );
};
