import type { StreamError, StreamErrorType } from '../types';

// Sample AI response passages for realistic mock streaming
const MOCK_RESPONSES = [
  `Large language models work by predicting the next token in a sequence given all preceding tokens. During inference, the model processes your prompt through multiple transformer layers — each layer attending to relevant tokens via multi-head self-attention mechanisms.

The attention mechanism computes query, key, and value matrices from the input embeddings. The dot-product of queries and keys determines attention weights, which are then applied to values to produce context-aware representations. This allows the model to capture long-range dependencies across thousands of tokens simultaneously.

After the transformer stack, a language model head projects the final hidden states into logits over the vocabulary. Sampling strategies like top-k, top-p (nucleus sampling), and temperature scaling determine which token is selected. Temperature close to 0 produces greedy, deterministic outputs — higher temperatures introduce creative randomness.`,

  `Streaming inference works by yielding tokens from the model as they are generated rather than waiting for the complete sequence. This dramatically improves perceived latency — users see the first token in milliseconds rather than waiting seconds for a full response.

Under the hood, this uses server-sent events (SSE) or chunked transfer encoding over HTTP. Each chunk contains one or more tokens serialized as JSON or plain text. The client reads from a ReadableStream, decoding chunks via TextDecoder and appending them incrementally to the UI.

AbortController integration allows the client to cancel an active stream, sending a signal to both the browser's fetch layer and ideally to the server to stop generation, saving compute resources.`,

  `Tokenization is the process of converting raw text into integer IDs that the model can process. Modern LLMs use subword tokenization — algorithms like BPE (Byte-Pair Encoding) or SentencePiece — which balance vocabulary size against coverage of rare words.

A typical vocabulary contains 32,000 to 128,000 tokens. Common English words are often single tokens, while rare or technical terms may be split into multiple pieces. For example, "tokenization" might be encoded as ["token", "ization"] — two tokens. This affects metrics: a 1,000-word response might require 1,200–1,500 tokens.

Tokens per second (TPS) is the primary throughput metric for LLM inference. State-of-the-art GPU inference can achieve 80–200+ TPS depending on model size, quantization, and hardware.`,
];

/**
 * Mock streaming backend using an async generator.
 * Emits words at ~100ms intervals to simulate real model inference.
 */
export async function* mockStreamGenerator(
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  const words = response.split(/(\s+)/); // preserve whitespace tokens

  for (const word of words) {
    if (signal.aborted) return;

    yield word;

    // Variable delay: 60–140ms to feel realistic
    const delay = 60 + Math.random() * 80;
    await sleep(delay);
  }
}

/**
 * Simulates a fetch-based streaming endpoint using a ReadableStream.
 * Returns a Response-like object that can be consumed via ReadableStream reader.
 */
export function createMockStreamResponse(signal: AbortSignal): ReadableStream<Uint8Array> {
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  const words = response.split(/(\s+)/);
  const encoder = new TextEncoder();

  let wordIndex = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      signal.addEventListener('abort', () => {
        if (intervalId !== null) clearInterval(intervalId);
        controller.close();
      });

      intervalId = setInterval(() => {
        if (signal.aborted || wordIndex >= words.length) {
          if (intervalId !== null) clearInterval(intervalId);
          if (!signal.aborted) controller.close();
          return;
        }

        const chunk = words[wordIndex++];
        controller.enqueue(encoder.encode(chunk));
      }, 90 + Math.random() * 40);
    },
  });
}

// ─── Error Utilities ─────────────────────────────────────────────────────────

export function classifyError(error: unknown): StreamError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { type: 'aborted', message: 'Stream was cancelled.', retryable: false };
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { type: 'network', message: 'Network error — check your connection.', retryable: true };
  }
  if (error instanceof Error && error.message.includes('timeout')) {
    return { type: 'timeout', message: 'Request timed out. The server took too long.', retryable: true };
  }
  if (error instanceof Error && error.message.includes('interrupted')) {
    return { type: 'interrupted', message: 'Stream was interrupted unexpectedly.', retryable: true };
  }
  const msg = error instanceof Error ? error.message : 'An unknown error occurred.';
  return { type: 'unknown', message: msg, retryable: true };
}

export function getErrorIcon(type: StreamErrorType): string {
  const icons: Record<StreamErrorType, string> = {
    network: '📡',
    timeout: '⏱',
    interrupted: '⚡',
    aborted: '🛑',
    unknown: '⚠️',
  };
  return icons[type];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTPS(tps: number): string {
  if (tps === 0) return '—';
  return tps < 10 ? tps.toFixed(1) : Math.round(tps).toString();
}

export function countTokens(text: string): number {
  // Rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
