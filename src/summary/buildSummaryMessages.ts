import { SummaryRequest } from './types';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const SYSTEM_PROMPT =
  'You summarize a live transcript of audio being played, such as an interview, meeting or talk. ' +
  'Given the current summary and new transcript text, return an updated summary as short bullet points ' +
  'covering the main topics, questions asked and conclusions. Output only the summary.';
const EMPTY_SUMMARY_PLACEHOLDER = '(none yet)';

export function buildSummaryMessages({ previousSummary, newText }: SummaryRequest): ChatMessage[] {
  if (!newText.trim()) throw new Error('newText is required');
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Current summary:\n${previousSummary.trim() || EMPTY_SUMMARY_PLACEHOLDER}\n\nNew transcript:\n${newText.trim()}`,
    },
  ];
}
