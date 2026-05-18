import React from 'react';
import type { TextInputProps } from '../../types';

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, disabled }) => {
  const charCount = value.length;
  const maxChars = 4000;
  const isNearLimit = charCount > maxChars * 0.85;

  return (
    <div className="relative flex flex-col gap-2">
      <label
        htmlFor="prompt-textarea"
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Prompt
      </label>
      <div className="relative">
        <textarea
          id="prompt-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxChars}
          placeholder="Describe what you want the AI to explain, write, or analyze…"
          aria-label="Prompt input"
          aria-describedby="prompt-char-count"
          rows={6}
          className="w-full resize-none rounded-xl transition-all duration-200"
          style={{
            padding: '16px 18px',
            fontSize: '14px',
            lineHeight: '1.7',
            fontFamily: 'var(--font-sans)',
            background: 'var(--color-bg-elevated)',
            border: `1px solid ${disabled ? 'var(--color-border-subtle)' : 'var(--color-border-default)'}`,
            color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            outline: 'none',
            caretColor: 'var(--color-accent-primary)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-accent-primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border-default)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div
        id="prompt-char-count"
        className="flex justify-between text-xs"
        style={{ color: isNearLimit ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
      >
        <span>Enter your prompt above</span>
        <span aria-live="polite">
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
