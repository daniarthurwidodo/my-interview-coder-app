import { AnalysisResult } from './useScreenshotAnalysis';

function formatResult(result: AnalysisResult, index: number): string {
  const label = `Screen ${index + 1}`;
  if (result.status === 'done') return `${label}:\n${result.text}`;
  if (result.status === 'failed') return `${label}: analysis failed: ${result.message}`;
  return `${label}: analyzing...`;
}

export function ScreenshotAnalysis({ analyses }: { analyses: AnalysisResult[] }) {
  return (
    <div id="screenshot-analysis">
      {analyses.map((result, index) => (
        <p key={index}>{formatResult(result, index)}</p>
      ))}
    </div>
  );
}
