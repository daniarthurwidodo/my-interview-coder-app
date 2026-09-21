import { useCallback, useState } from 'react';
import { toErrorMessage } from '../errors';

export type AnalysisResult =
  | { status: 'analyzing' }
  | { status: 'done'; text: string }
  | { status: 'failed'; message: string };

export function useScreenshotAnalysis() {
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [captureError, setCaptureError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const setAnalysisAt = useCallback((index: number, result: AnalysisResult) => {
    setAnalyses((previous) => previous.map((item, i) => (i === index ? result : item)));
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    setIsBusy(true);
    setCaptureError('');
    try {
      const captured = await window.electronAPI.captureScreens();
      setScreenshots(captured);
      setAnalyses(captured.map((): AnalysisResult => ({ status: 'analyzing' })));
      for (let i = 0; i < captured.length; i++) {
        try {
          const text = await window.electronAPI.analyzeScreenshot(captured[i]);
          setAnalysisAt(i, { status: 'done', text });
        } catch (error) {
          setAnalysisAt(i, { status: 'failed', message: toErrorMessage(error) });
        }
      }
    } catch (error) {
      setCaptureError(`Screenshot failed: ${toErrorMessage(error)}`);
    } finally {
      setIsBusy(false);
    }
  }, [setAnalysisAt]);

  return { screenshots, analyses, captureError, isBusy, captureAndAnalyze };
}
