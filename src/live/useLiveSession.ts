import { useCallback, useEffect, useRef, useState } from 'react';
import { startAudioPipeline } from '../audio/startAudioPipeline';
import { AUDIO_STATUS } from '../constants';
import { toErrorMessage } from '../errors';
import { useRollingSummary } from './useRollingSummary';
import { useTranscript } from './useTranscript';

export type AudioStatusKey = keyof typeof AUDIO_STATUS;

export function useLiveSession() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopPipelineRef = useRef<(() => Promise<void>) | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatusKey>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    summary,
    addText,
    start: startSummary,
    stop: stopSummary,
    reset: resetSummary,
  } = useRollingSummary((message) => setErrorMessage(`Summary error: ${message}`));
  const { lines, interimText, reset: resetTranscript, clearInterim } = useTranscript(addText);

  useEffect(
    () =>
      window.electronAPI.onTranscriptionError((message) =>
        setErrorMessage(`Transcription error: ${message}`),
      ),
    [],
  );

  const startListening = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Waveform canvas is not ready');
    resetTranscript();
    resetSummary();
    startSummary();
    try {
      const pipeline = await startAudioPipeline({
        canvas,
        onPlayingChange: (isPlaying) => setAudioStatus(isPlaying ? 'PLAYING' : 'SILENT'),
      });
      stopPipelineRef.current = pipeline.stop;
    } catch (error) {
      await stopSummary();
      throw error;
    }
  }, [resetTranscript, resetSummary, startSummary, stopSummary]);

  const stopListening = useCallback(async () => {
    const stopPipeline = stopPipelineRef.current;
    if (!stopPipeline) return;
    stopPipelineRef.current = null;
    await stopPipeline();
    await stopSummary();
    setAudioStatus('IDLE');
    clearInterim();
  }, [stopSummary, clearInterim]);

  const toggleListening = useCallback(async () => {
    setIsBusy(true);
    setErrorMessage('');
    try {
      if (stopPipelineRef.current) await stopListening();
      else await startListening();
    } catch (error) {
      setErrorMessage(`Audio capture failed: ${toErrorMessage(error)}`);
    } finally {
      setIsListening(stopPipelineRef.current !== null);
      setIsBusy(false);
    }
  }, [startListening, stopListening]);

  return {
    canvasRef,
    isListening,
    isBusy,
    audioStatus,
    errorMessage,
    lines,
    interimText,
    summary,
    toggleListening,
  };
}
