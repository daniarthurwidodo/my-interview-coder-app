import { useCallback, useRef, useState } from 'react';
import { createRollingSummarizer, RollingSummarizer } from '../summary/rollingSummarizer';

export function useRollingSummary(onError: (message: string) => void) {
  const [summary, setSummary] = useState('');
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const summarizerRef = useRef<RollingSummarizer | null>(null);
  if (!summarizerRef.current) {
    summarizerRef.current = createRollingSummarizer({
      summarize: window.electronAPI.summarize,
      onSummary: setSummary,
      onError: (message) => onErrorRef.current(message),
    });
  }
  const { addText, start, stop } = summarizerRef.current;
  const reset = useCallback(() => setSummary(''), []);

  return { summary, addText, start, stop, reset };
}
