// ─── Input Modes ────────────────────────────────────────────────────────────
export type InputMode = 'text' | 'audio';

// ─── Stream Status ────────────────────────────────────────────────────────────
export type StreamStatus =
  | 'idle'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'aborted';

// ─── Error Types ─────────────────────────────────────────────────────────────
export type StreamErrorType =
  | 'network'
  | 'timeout'
  | 'interrupted'
  | 'aborted'
  | 'unknown';

export interface StreamError {
  type: StreamErrorType;
  message: string;
  retryable: boolean;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────
export interface StreamMetrics {
  tokenCount: number;
  tokensPerSecond: number;
  elapsedMs: number;
  startTime: number | null;
}

// ─── Stream State ─────────────────────────────────────────────────────────────
export interface StreamState {
  status: StreamStatus;
  output: string;
  metrics: StreamMetrics;
  error: StreamError | null;
}

// ─── Inference Request ────────────────────────────────────────────────────────
export interface InferenceRequest {
  mode: InputMode;
  prompt?: string;
  audioBlob?: Blob;
}

// ─── Recording State ─────────────────────────────────────────────────────────
export type RecordingStatus = 'idle' | 'recording' | 'ready';

export interface RecordingState {
  status: RecordingStatus;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

export interface AudioInputProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  disabled: boolean;
}

export interface MetricsBadgeProps {
  metrics: StreamMetrics;
  status: StreamStatus;
}

export interface StreamOutputProps {
  output: string;
  status: StreamStatus;
  error: StreamError | null;
  onRetry: () => void;
}

export interface GenerateButtonProps {
  onClick: () => void;
  onAbort: () => void;
  status: StreamStatus;
  disabled: boolean;
}
