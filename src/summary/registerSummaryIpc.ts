import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../constants';
import { buildScreenshotMessages } from './buildScreenshotMessages';
import { buildSummaryMessages } from './buildSummaryMessages';
import { readOpenRouterApiKey, requestChatCompletion } from './openRouterClient';
import { prepareScreenshotForAnalysis } from './prepareScreenshot';
import { SummaryRequest } from './types';

const SUMMARY_MODEL = 'openrouter/free';
// Paid vision models, cheapest first; OpenRouter tries them in order and allows at most 3 entries.
const SCREENSHOT_MODELS = [
  'z-ai/glm-5.3-flash',
  'deepseek/deepseek-v4.1-flash',
  'moonshotai/kimi-k2.7-code',
];
const MAX_SUMMARY_INPUT_CHARS = 20000;

function validateSummaryRequest(request: SummaryRequest): void {
  if (typeof request?.previousSummary !== 'string') throw new Error('previousSummary must be a string');
  if (typeof request?.newText !== 'string') throw new Error('newText must be a string');
  const totalChars = request.previousSummary.length + request.newText.length;
  if (totalChars > MAX_SUMMARY_INPUT_CHARS) throw new Error('Summary input is too long');
}

async function summarize(request: SummaryRequest): Promise<string> {
  validateSummaryRequest(request);
  return requestChatCompletion({
    apiKey: readOpenRouterApiKey(),
    models: [SUMMARY_MODEL],
    messages: buildSummaryMessages(request),
  });
}

async function analyzeScreenshot(pngDataUrl: unknown): Promise<string> {
  const imageDataUrl = prepareScreenshotForAnalysis(pngDataUrl);
  return requestChatCompletion({
    apiKey: readOpenRouterApiKey(),
    models: SCREENSHOT_MODELS,
    messages: buildScreenshotMessages(imageDataUrl),
  });
}

export function registerSummaryIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SUMMARIZE, (_event, request: SummaryRequest) => summarize(request));
  ipcMain.handle(IPC_CHANNELS.ANALYZE_SCREENSHOT, (_event, pngDataUrl: unknown) =>
    analyzeScreenshot(pngDataUrl),
  );
}
