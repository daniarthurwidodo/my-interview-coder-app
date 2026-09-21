import { SUMMARY_INTERVAL_MS } from '../constants';
import { SummaryRequest } from './types';

interface RollingSummarizerOptions {
  summarize: (request: SummaryRequest) => Promise<string>;
  onSummary: (summary: string) => void;
  onError: (message: string) => void;
}

export function createRollingSummarizer({ summarize, onSummary, onError }: RollingSummarizerOptions) {
  let summary = '';
  let pendingText = '';
  let isRequestRunning = false;
  let timerId: number | null = null;

  const flush = async (): Promise<void> => {
    if (isRequestRunning || !pendingText) return;
    isRequestRunning = true;
    const newText = pendingText;
    pendingText = '';
    try {
      summary = await summarize({ previousSummary: summary, newText });
      onSummary(summary);
    } catch (error) {
      pendingText = `${newText} ${pendingText}`.trim();
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      isRequestRunning = false;
    }
  };

  return {
    addText(text: string): void {
      pendingText = pendingText ? `${pendingText} ${text}` : text;
    },
    start(): void {
      summary = '';
      pendingText = '';
      timerId = window.setInterval(flush, SUMMARY_INTERVAL_MS);
    },
    async stop(): Promise<void> {
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
      await flush();
    },
  };
}

export type RollingSummarizer = ReturnType<typeof createRollingSummarizer>;
