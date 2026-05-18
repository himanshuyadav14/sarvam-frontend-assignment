import React from 'react';
import type { InputMode } from '../../types';

interface InputModeToggleProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
  disabled: boolean;
}

const MODES: { id: InputMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
        <rect x="1" y="6" width="10" height="2" rx="1" fill="currentColor" />
        <rect x="1" y="10" width="7" height="2" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M2 7.5C2 9.985 4.239 12 7 12s5-2.015 5-4.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const InputModeToggle: React.FC<InputModeToggleProps> = ({ mode, onChange, disabled }) => {
  return (
    <div
      role="group"
      aria-label="Input mode selection"
      className="flex gap-1 p-1 rounded-xl"
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        padding: '6px',
      }}
    >
      {MODES.map(({ id, label, icon }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            id={`mode-${id}`}
            role="radio"
            aria-checked={isActive}
            aria-label={`Switch to ${label} input mode`}
            onClick={() => !disabled && onChange(id)}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              minHeight: '46px',
              padding: '10px 20px',
              background: isActive ? 'var(--color-accent-primary)' : 'transparent',
              color: isActive ? 'white' : 'var(--color-text-secondary)',
              boxShadow: isActive ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
              border: 'none',
              opacity: disabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive && !disabled) {
                e.currentTarget.style.color = 'var(--color-text-primary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
};
