import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../constants';
import { buildSummaryMessages } from './buildSummaryMessages';
import { requestChatCompletion } from './openRouterClient';
import { SummaryRequest } from './types';

const API_KEY_ENV_NAME = 'OPENROUTER_API_KEY';
const SUMMARY_MODEL = 'openrouter/free';
const MAX_SUMMARY_INPUT_CHARS = 20000;

function validateSummaryRequest(request: SummaryRequest): void {
  if (typeof request?.previousSummary !== 'string') throw new Error('previousSummary must be a string');
  if (typeof request?.newText !== 'string') throw new Error('newText must be a string');
  const totalChars = request.previousSummary.length + request.newText.length;
  if (totalChars > MAX_SUMMARY_INPUT_CHARS) throw new Error('Summary input is too long');
}

async function summarize(request: SummaryRequest): Promise<string> {
  validateSummaryRequest(request);
  const apiKey = process.env[API_KEY_ENV_NAME];
  if (!apiKey) throw new Error(`${API_KEY_ENV_NAME} is not set`);
  return requestChatCompletion({
    apiKey,
    model: SUMMARY_MODEL,
    messages: buildSummaryMessages(request),
  });
}

export function registerSummaryIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SUMMARIZE, (_event, request: SummaryRequest) => summarize(request));
}
