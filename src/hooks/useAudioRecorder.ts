import { useCallback, useRef, useState } from 'react';
import type { RecordingState } from '../types';

const INITIAL_STATE: RecordingState = {
  status: 'idle',
  audioBlob: null,
  audioUrl: null,
  durationMs: 0,
};

interface UseAudioRecorderReturn {
  state: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;

        setState({ status: 'ready', audioBlob: blob, audioUrl: url, durationMs });

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(100); // collect in 100ms chunks
      setState({ status: 'recording', audioBlob: null, audioUrl: null, durationMs: 0 });
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access in your browser.'
          : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone and try again.'
          : 'Failed to start recording. Please check your microphone.';
      setError(msg);
      setState(INITIAL_STATE);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [state.status]);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setState(INITIAL_STATE);
    setError(null);
  }, [state.audioUrl]);

  return { state, startRecording, stopRecording, clearRecording, error };
}
