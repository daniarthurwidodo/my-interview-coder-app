import { useCallback, useEffect, useRef, useState } from 'react';

export function useTranscript(onFinalText: (text: string) => void) {
  const [lines, setLines] = useState<string[]>([]);
  const [interimText, setInterimText] = useState('');
  const onFinalTextRef = useRef(onFinalText);
  onFinalTextRef.current = onFinalText;

  useEffect(
    () =>
      window.electronAPI.onTranscript(({ text, isFinal }) => {
        if (!isFinal) {
          setInterimText(text);
          return;
        }
        setInterimText('');
        setLines((previous) => [...previous, text]);
        onFinalTextRef.current(text);
      }),
    [],
  );

  const reset = useCallback(() => {
    setLines([]);
    setInterimText('');
  }, []);
  const clearInterim = useCallback(() => setInterimText(''), []);

  return { lines, interimText, reset, clearInterim };
}
