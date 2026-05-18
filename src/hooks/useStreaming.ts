import { useCallback, useRef, useState } from 'react';
import type { StreamError, StreamMetrics, StreamState } from '../types';
import { classifyError, countTokens, createMockStreamResponse } from '../lib/mockBackend';

const INITIAL_METRICS: StreamMetrics = {
  tokenCount: 0,
  tokensPerSecond: 0,
  elapsedMs: 0,
  startTime: null,
};

const INITIAL_STATE: StreamState = {
  status: 'idle',
  output: '',
  metrics: INITIAL_METRICS,
  error: null,
};

interface UseStreamingReturn {
  state: StreamState;
  startStream: (prompt: string) => Promise<void>;
  abortStream: () => void;
  reset: () => void;
}

export function useStreaming(): UseStreamingReturn {
  const [state, setState] = useState<StreamState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const metricsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedOutputRef = useRef<string>('');

  const clearMetricsTimer = () => {
    if (metricsTimerRef.current !== null) {
      clearInterval(metricsTimerRef.current);
      metricsTimerRef.current = null;
    }
  };

  const startMetricsTimer = () => {
    metricsTimerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      const tokenCount = countTokens(accumulatedOutputRef.current);
      const tokensPerSecond = elapsedSec > 0 ? tokenCount / elapsedSec : 0;

      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          tokenCount,
          tokensPerSecond,
          elapsedMs,
        },
      }));
    }, 200);
  };

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearMetricsTimer();
    setState((prev) => ({
      ...prev,
      status: 'aborted',
      error: {
        type: 'aborted',
        message: 'Generation was stopped by the user.',
        retryable: false,
      },
    }));
  }, []);

  const startStream = useCallback(async (_prompt: string) => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearMetricsTimer();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    accumulatedOutputRef.current = '';
    startTimeRef.current = Date.now();

    setState({
      status: 'streaming',
      output: '',
      metrics: { ...INITIAL_METRICS, startTime: startTimeRef.current },
      error: null,
    });

    startMetricsTimer();

    try {
      // Simulate fetch with ReadableStream
      const stream = createMockStreamResponse(controller.signal);
      const reader = stream.getReader();
      const decoder = new TextDecoder('utf-8');

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (controller.signal.aborted) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedOutputRef.current += chunk;

        setState((prev) => ({
          ...prev,
          output: accumulatedOutputRef.current,
        }));
      }

      // Flush decoder
      const finalChunk = decoder.decode();
      if (finalChunk) {
        accumulatedOutputRef.current += finalChunk;
        setState((prev) => ({ ...prev, output: accumulatedOutputRef.current }));
      }

      if (!controller.signal.aborted) {
        clearMetricsTimer();
        const finalElapsedMs = Date.now() - startTimeRef.current;
        const finalTokenCount = countTokens(accumulatedOutputRef.current);
        const finalTPS = finalElapsedMs > 0 ? (finalTokenCount / finalElapsedMs) * 1000 : 0;

        setState((prev) => ({
          ...prev,
          status: 'complete',
          metrics: {
            tokenCount: finalTokenCount,
            tokensPerSecond: finalTPS,
            elapsedMs: finalElapsedMs,
            startTime: startTimeRef.current,
          },
        }));
      }
    } catch (err: unknown) {
      clearMetricsTimer();

      // Never clear existing streamed output on error
      const streamError: StreamError = classifyError(err);

      if (streamError.type === 'aborted') {
        // Already handled by abortStream()
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: streamError,
        // Preserve partial output — do NOT reset output
      }));
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearMetricsTimer();
    accumulatedOutputRef.current = '';
    setState(INITIAL_STATE);
  }, []);

  return { state, startStream, abortStream, reset };
}
