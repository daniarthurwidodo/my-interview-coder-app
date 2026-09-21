import { LiveControls } from './live/LiveControls';
import { SummaryPanel } from './live/SummaryPanel';
import { TranscriptPanel } from './live/TranscriptPanel';
import { useLiveSession } from './live/useLiveSession';
import { CaptureControls } from './screenshot/CaptureControls';
import { ScreenshotAnalysis } from './screenshot/ScreenshotAnalysis';
import { useScreenshotAnalysis } from './screenshot/useScreenshotAnalysis';

export function App() {
  const screenshot = useScreenshotAnalysis();
  const live = useLiveSession();

  return (
    <>
      <h1>💖 Hello World!</h1>
      <p>Welcome to your Electron application.</p>
      <CaptureControls
        screenshots={screenshot.screenshots}
        captureError={screenshot.captureError}
        isBusy={screenshot.isBusy}
        onCapture={screenshot.captureAndAnalyze}
      />
      <hr />
      <LiveControls
        canvasRef={live.canvasRef}
        isListening={live.isListening}
        isBusy={live.isBusy}
        audioStatus={live.audioStatus}
        errorMessage={live.errorMessage}
        onToggle={live.toggleListening}
      />
      <TranscriptPanel lines={live.lines} interimText={live.interimText} />
      <SummaryPanel summary={live.summary} />
      <h3>Screenshot analysis</h3>
      <ScreenshotAnalysis analyses={screenshot.analyses} />
    </>
  );
}
