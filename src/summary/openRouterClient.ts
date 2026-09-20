import { ChatMessage } from './types';

const API_KEY_ENV_NAME = 'OPENROUTER_API_KEY';
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 120000;
const ERROR_BODY_PREVIEW_CHARS = 200;

export function readOpenRouterApiKey(): string {
  const apiKey = process.env[API_KEY_ENV_NAME];
  if (!apiKey) throw new Error(`${API_KEY_ENV_NAME} is not set`);
  return apiKey;
}

export async function requestChatCompletion({
  apiKey,
  models,
  messages,
}: {
  apiKey: string;
  models: string[];
  messages: ChatMessage[];
}): Promise<string> {
  if (!apiKey) throw new Error('OpenRouter API key is required');
  if (!models.length) throw new Error('At least one model is required');

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ models, messages }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter HTTP ${response.status}: ${errorBody.slice(0, ERROR_BODY_PREVIEW_CHARS)}`,
    );
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter returned no content');
  }
  return content.trim();
}
