# AI Inference Playground

A production-quality React + TypeScript frontend for streaming AI model inference, built with Vite, TailwindCSS v4, and a fully custom token-level diff viewer.

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Streaming Implementation](#2-streaming-implementation)
3. [Error Handling Strategy](#3-error-handling-strategy)
4. [Accessibility Considerations](#4-accessibility-considerations)
5. [Diff Algorithm — LCS](#5-diff-algorithm--lcs)
6. [Complexity Analysis](#6-complexity-analysis)
7. [Why LCS over Myers Diff](#7-why-lcs-over-myers-diff)
8. [Tradeoffs](#8-tradeoffs)
9. [Future Improvements](#9-future-improvements)
10. [Getting Started](#10-getting-started)

---

## 1. Architecture Decisions

### Component Hierarchy

The application is split into two independent features accessible via a tab navigation:

```
App
├── Header                          ← Sticky branding + status indicator
├── Tab Navigation                  ← WAI-ARIA tablist (Playground / Diff Viewer)
├── Playground                      ← Inference feature
│   ├── InputModeToggle             ← Text / Audio mode switch
│   ├── TextInput                   ← Controlled textarea with char counter
│   ├── AudioInput                  ← MediaRecorder API wrapper
│   ├── GenerateButton              ← Primary CTA with separate Stop button
│   ├── MetricsBadge                ← Sticky live metrics panel
│   └── StreamOutput                ← Token-streaming output display
└── DiffViewer                      ← Token diff feature
    ├── DiffPanel × 2              ← Labelled side-by-side panels
    └── TokenSpan                   ← Individual colored token chip
```

### Custom Hooks

All stateful logic is extracted into hooks, keeping components presentational:

| Hook | Responsibility |
|---|---|
| `useStreaming` | Manages fetch → ReadableStream pipeline, AbortController, metrics interval |
| `useAudioRecorder` | Wraps MediaRecorder API lifecycle (request, record, stop, cleanup) |

### Utility Layer

| Module | Purpose |
|---|---|
| `lib/mockBackend.ts` | Simulates a streaming API endpoint via `ReadableStream`; classifies errors |
| `utils/diff.ts` | Pure functional LCS diff — no side effects, fully typed, zero dependencies |

### Design Principles

- **Separation of concerns** — hooks own state, utilities own algorithms, components own rendering.
- **Zero external logic libraries** — all diffing, streaming, and recording logic is implemented from scratch.
- **Inline styles for critical sizing** — Tailwind class purging can silently omit dynamic classes; explicit `style` props guarantee sizing (e.g. `minHeight`, `padding`) survives production builds.

---

## 2. Streaming Implementation

### Pipeline

```
Mock ReadableStream (mockBackend.ts)
        │  emits Uint8Array chunks every ~90–130ms
        ▼
fetch() / ReadableStream reader
        │  reader.read() → { done, value }
        ▼
TextDecoder.decode(value, { stream: true })
        │  converts bytes → string chunk
        ▼
accumulatedOutputRef (mutable ref, no re-render cost)
        │  appended per chunk
        ▼
setState({ output: accumulated })   ← triggers re-render per token
        │
        ▼
StreamOutput component              ← renders updated text + streaming cursor
```

### Key Implementation Details

**AbortController integration**

```typescript
const controller = new AbortController();
abortControllerRef.current = controller;
const stream = createMockStreamResponse(controller.signal);
```

The signal is threaded through to the `ReadableStream` constructor. Calling `controller.abort()` closes the stream from the inside, preventing additional `controller.enqueue()` calls and triggering a clean `close()` on the reader.

**Metrics interval**

A `setInterval` running at 200ms computes live token count and tokens-per-second independently of the render cycle, preventing metrics updates from creating unnecessary token flushes:

```typescript
metricsTimerRef.current = setInterval(() => {
  const tokenCount = countTokens(accumulatedOutputRef.current);
  const tps = (tokenCount / elapsedSec);
  setState(prev => ({ ...prev, metrics: { tokenCount, tps, ... } }));
}, 200);
```

**Auto-scroll with user override**

`StreamOutput` tracks whether the user has manually scrolled up. If `isUserScrolled` is `false`, each new `output` prop update triggers `scrollTop = scrollHeight`. A floating "Jump to bottom" button appears when the user is scrolled up during active streaming, so they can re-engage without losing their place.

---

## 3. Error Handling Strategy

### Error Classification

All stream errors are classified into typed categories in `lib/mockBackend.ts`:

```typescript
type StreamErrorType = 'network' | 'timeout' | 'interrupted' | 'aborted' | 'unknown';
```

| Type | Trigger | Retryable |
|---|---|---|
| `aborted` | User clicked Stop | ✗ |
| `network` | `TypeError` on fetch | ✓ |
| `timeout` | Error message contains "timeout" | ✓ |
| `interrupted` | Stream closed unexpectedly | ✓ |
| `unknown` | Any other Error | ✓ |

### Partial Output Preservation

**Partial output is never cleared on error.** When a stream fails mid-generation, `useStreaming` transitions status to `'error'` without resetting `output`:

```typescript
setState((prev) => ({
  ...prev,           // ← preserves prev.output
  status: 'error',
  error: streamError,
}));
```

The `StreamOutput` component surfaces a note — *"Partial output preserved above"* — so users understand what was received before the failure.

### Abort vs Error

User-initiated cancellations are treated separately from errors. An `AbortError` is caught, classified as `type: 'aborted'`, `retryable: false`, and the stream hook returns early without overwriting a prior error state.

---

## 4. Accessibility Considerations

### Keyboard Navigation

- All interactive elements are native `<button>` and `<textarea>` elements — fully keyboard accessible by default.
- The mode toggle implements `role="group"` with `role="radio"` / `aria-checked` on each option.
- The tab navigation uses `role="tablist"`, `role="tab"`, `aria-selected`, and `aria-controls` per WAI-ARIA Authoring Practices.
- A skip-navigation link (`Skip to main content`) is the first focusable element, hidden until focused.

### Live Regions

| Element | `aria-live` | Rationale |
|---|---|---|
| Stream output `<div>` | `polite` | Announces token additions without interrupting screen reader |
| Error banner | `assertive` | Error must be announced immediately |
| Recording timer | `polite` | Duration updates every 100ms — polite avoids flooding |
| Metrics region | `polite` | Updates every 200ms — polite, atomic=false |

### Focus States

All focusable elements expose `:focus-visible` outlines styled to `2px solid var(--color-accent-primary)` with an `outline-offset: 2px`, ensuring WCAG 2.1 AA visibility without impacting pointer users.

### Semantic Structure

- Single `<h1>` in the header (application title).
- `<h2>` for the Diff Viewer page heading.
- `<main id="main-content">` on each tab panel.
- `<label>` elements explicitly `htmlFor`-linked to their inputs.
- `<kbd>` for keyboard hint in the footer.
- `role="region"` with `aria-label` on all major UI sections.

### Audio Input

- `aria-pressed` on Record/Stop buttons reflects toggle state.
- The waveform visualizer is `role="img"` with a descriptive `aria-label`.
- The `<audio>` playback element includes `aria-label="Recorded audio playback"`.

---

## 5. Diff Algorithm — LCS

### Overview

The diff viewer (`src/utils/diff.ts`) implements a **Longest Common Subsequence (LCS)** algorithm using bottom-up dynamic programming to produce a token-level edit script between two text inputs.

### Steps

```
1. Tokenize
   textA.trim().split(/\s+/) → string[]    (whitespace tokenization)

2. Build DP Table
   dp[i][j] = LCS length of A[0..i-1] and B[0..j-1]

   Recurrence:
     A[i-1] === B[j-1]  →  dp[i][j] = dp[i-1][j-1] + 1
     otherwise          →  dp[i][j] = max(dp[i-1][j], dp[i][j-1])

3. Backtrack
   From dp[m][n] → dp[0][0]:
     diagonal move  → EQUAL
     move up        → DELETE (token in A, not in B)
     move left      → INSERT (token in B, not in A)

4. Map to panels
   Left  (Model A): EQUAL + DELETE tokens
   Right (Model B): EQUAL + INSERT tokens
```

### Similarity Metric

The Sørensen–Dice coefficient is used as the similarity score:

```
similarity = (2 × |equal tokens|) / (|A| + |B|)
```

This is preferred over Jaccard similarity because it double-weights matches, making it more sensitive to shared content in asymmetric sequences.

---

## 6. Complexity Analysis

| Phase | Time | Space |
|---|---|---|
| Tokenization | O(n) | O(n) |
| LCS DP table build | **O(m × n)** | **O(m × n)** |
| Backtracking | O(m + n) | O(m + n) |
| Rendering N tokens | O(N) | O(N) |

Where `m = |tokensA|`, `n = |tokensB|`.

**Practical bounds:** For typical model outputs of 300–500 tokens each, the DP table contains at most 250,000 cells — trivially fast in a browser (~1–3ms).

**Space optimisation note:** The DP table can be reduced to O(min(m, n)) using Hirschberg's algorithm (space-efficient LCS), at the cost of significantly increased implementation complexity. This optimisation is deferred given the bounded input sizes.

---

## 7. Why LCS over Myers Diff

| Criterion | LCS (chosen) | Myers Diff |
|---|---|---|
| **Time complexity** | O(m × n) | O(ND) where D = edit distance |
| **Space complexity** | O(m × n) | O(N) with linear-space refinement |
| **Implementation complexity** | Low — standard DP | High — greedy k-diagonal search |
| **Correctness guarantees** | Deterministic, provable | Heuristic path selection |
| **Best case** | O(m × n) always | O(N) when D is small |
| **Worst case** | O(m × n) | O(ND) → approaches O(N²) when D ≈ N |
| **Suited for** | Token-level (short sequences) | Character-level (long files) |

**Decision rationale:**

Myers diff excels when comparing large character-level sequences (e.g., source code files with thousands of characters) where minimising the number of edit operations `D` is critical to performance. In that setting, the O(ND) bound is significantly better than O(m×n).

For token-level comparison of NLP model outputs, however:

1. **Sequence lengths are short** — 50 to 500 tokens per document is typical, making O(m×n) ≤ 250,000 operations — negligible on modern hardware.
2. **Correctness over speed** — LCS backtracking is a single deterministic pass with no heuristic tie-breaking, producing stable, reproducible diffs.
3. **Maintainability** — The DP formulation is taught in undergraduate algorithms courses; any engineer can read, verify, and extend it.
4. **No external dependency** — A correct Myers implementation is non-trivial; LCS can be implemented correctly in ~60 lines with full comments.

---

## 8. Tradeoffs

### Whitespace Tokenization vs Sub-word Tokenization

**Chosen:** split on whitespace (`\s+`).  
**Alternative:** BPE / SentencePiece sub-word tokenization (as used by actual LLMs).

| | Whitespace | Sub-word |
|---|---|---|
| Granularity | Word-level | Finer — splits "tokenization" → ["token", "ization"] |
| Alignment with model | No | Yes |
| Implementation complexity | Trivial | Requires vocabulary + merge rules |
| Human readability | High | Lower |

Whitespace tokenization was selected because the diff viewer's primary purpose is human legibility, not reproducing the model's internal token boundaries.

### Inline Styles vs Tailwind Utility Classes

**Chosen:** mixed — Tailwind for layout/spacing, inline styles for critical sizing.  
**Rationale:** Tailwind v4's JIT compiler purges classes not statically detectable in template strings. Computed class names (e.g. `py-${n}`) are silently dropped in production builds. Explicit `style={{ minHeight: '56px', padding: '14px 20px' }}` props are immune to purging and guarantee consistent cross-browser rendering.

### Mock Backend vs Real API

The streaming backend is fully simulated using `ReadableStream` in the browser. This:
- Eliminates server infrastructure for the assignment
- Accurately models the fetch → ReadableStream → TextDecoder pipeline used with real APIs (OpenAI, Anthropic, etc.)
- Makes the code drop-in ready: replacing `createMockStreamResponse` with a real `fetch('/api/stream')` call requires zero changes to the consuming hook

---

## 9. Future Improvements

### Streaming

| Improvement | Description |
|---|---|
| **Real SSE endpoint** | Replace mock with a Node.js/FastAPI backend emitting `text/event-stream` |
| **Backpressure handling** | Detect when the DOM renderer lags behind the stream and batch token updates |
| **Timeout with retry** | Implement configurable timeout with exponential backoff retry logic |
| **Request queueing** | Queue concurrent requests rather than aborting the previous stream |

### Diff Viewer

| Improvement | Description |
|---|---|
| **Hirschberg's algorithm** | Reduce DP space from O(m×n) to O(min(m,n)) for very long inputs |
| **Sentence-level alignment** | Run LCS at sentence granularity first, then word-level within aligned segments |
| **Sub-word tokenization** | Integrate a BPE tokenizer to diff at the same granularity as the model |
| **Synchronised scrolling** | Lock both panels to scroll together for easier side-by-side comparison |
| **Export** | Download diff as HTML or JSON |

### Inference Playground

| Improvement | Description |
|---|---|
| **Model selector** | Dropdown with named model configs (temperature, top-p, max tokens) |
| **Conversation history** | Multi-turn chat with scrollable message list |
| **Audio transcription** | Integrate Whisper API to convert recorded audio to text before inference |
| **Output persistence** | Save and restore past generations via `localStorage` |
| **Prompt templates** | Pre-built system prompt library selectable per use case |

### Engineering

| Improvement | Description |
|---|---|
| **Unit tests** | Jest + Testing Library for diff utility and streaming hook |
| **E2E tests** | Playwright for streaming flow, error states, and keyboard navigation |
| **Bundle analysis** | `rollup-plugin-visualizer` to track chunk sizes |
| **CSP headers** | Content Security Policy for XSS protection on deployment |
| **PWA** | Service worker for offline capability and installability |

---

## 10. Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install and run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173

# Type-check
npx tsc --noEmit

# Production build
npm run build
```

### Project structure

```
src/
├── components/
│   ├── controls/
│   │   ├── GenerateButton.tsx   ← Generate + Stop CTA
│   │   └── InputModeToggle.tsx  ← Text/Audio radio toggle
│   ├── diff/
│   │   ├── DiffPanel.tsx        ← Single diff side panel
│   │   ├── DiffViewer.tsx       ← Full side-by-side viewer
│   │   └── TokenSpan.tsx        ← Colored token chip
│   ├── inputs/
│   │   ├── AudioInput.tsx       ← MediaRecorder recording UI
│   │   └── TextInput.tsx        ← Prompt textarea
│   ├── layout/
│   │   └── Header.tsx           ← Sticky app header
│   ├── output/
│   │   └── StreamOutput.tsx     ← Streaming text display
│   ├── MetricsBadge.tsx         ← Live metrics panel
│   └── Playground.tsx           ← Inference playground page
├── hooks/
│   ├── useAudioRecorder.ts      ← MediaRecorder state machine
│   └── useStreaming.ts          ← Fetch + ReadableStream pipeline
├── lib/
│   └── mockBackend.ts           ← Simulated streaming API + error utils
├── types/
│   └── index.ts                 ← All shared TypeScript interfaces
├── utils/
│   └── diff.ts                  ← LCS diff algorithm (no dependencies)
├── App.tsx                      ← Root layout + tab navigation
├── index.css                    ← TailwindCSS v4 + design tokens + animations
└── main.tsx                     ← React entry point
```

### Technology choices

| Technology | Version | Reason |
|---|---|---|
| React | 19 | Concurrent features, stable |
| TypeScript | 5 | Full type safety, no `any` |
| Vite | 6 | Sub-second HMR, native ESM |
| TailwindCSS | v4 (Vite plugin) | Zero-config, JIT, CSS-native theming |
| MediaRecorder API | Browser native | No library needed for audio capture |
| ReadableStream API | Browser native | Matches real SSE/chunked-transfer streaming |
