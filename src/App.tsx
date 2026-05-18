import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Playground } from './components/Playground';
import { DiffViewer } from './components/diff/DiffViewer';

type AppTab = 'playground' | 'diff';

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'playground',
    label: 'Inference Playground',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'diff',
    label: 'Token Diff Viewer',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="5" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8" y="2" width="5" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="6.5" y1="7" x2="7.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('playground');

  return (
    <div
      className="flex flex-col min-h-dvh relative"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      <div className="relative flex flex-col min-h-dvh" style={{ zIndex: 1 }}>
        <Header />

        {/* Skip nav */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
          style={{ background: 'var(--color-accent-primary)', color: 'white' }}
        >
          Skip to main content
        </a>

        {/* ── Tab Navigation ─────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Application sections"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px 24px 0',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2px',
              padding: '4px',
              borderRadius: '12px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {TABS.map(({ id, label, icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${id}`}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    background: isActive
                      ? 'var(--color-accent-primary)'
                      : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text-secondary)',
                    boxShadow: isActive
                      ? '0 2px 10px rgba(124,58,237,0.35)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
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
        </div>

        {/* ── Tab Panels ─────────────────────────────────────────── */}
        <div
          className="flex-1 flex justify-center w-full"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'playground' ? <Playground /> : <DiffViewer />}
        </div>
      </div>
    </div>
  );
};

export default App;
