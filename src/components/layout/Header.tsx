import React from 'react';

export const Header: React.FC = () => {
  return (
    <header
      className="flex items-center justify-between border-b w-full"
      style={{
        background: 'rgba(10, 10, 15, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'var(--color-border-subtle)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '18px 32px',
        minHeight: '72px',
      }}
    >
      {/* Logo & title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Logo icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-accent-primary), #5b21b6)',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.4" />
            <path
              d="M10 6.5v7M7 10h6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Title + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <h1
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '1.2',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            AI Inference Playground
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              lineHeight: '1',
              margin: 0,
            }}
          >
            Streaming · Real-time
          </p>
        </div>
      </div>

      {/* Model Online status pill */}
      <div
        role="status"
        aria-label="Model online"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: 'var(--color-success)',
          fontSize: '13px',
          fontWeight: '500',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        Model Online
      </div>
    </header>
  );
};
