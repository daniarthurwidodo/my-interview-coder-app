import { TranscriptSegment } from './types';

const DEEPGRAM_RESULTS_TYPE = 'Results';

export function parseTranscriptMessage(rawMessage: unknown): TranscriptSegment | null {
  if (typeof rawMessage !== 'string') return null;

  let message: any;
  try {
    message = JSON.parse(rawMessage);
  } catch (error) {
    throw new Error(`Deepgram sent invalid JSON: ${rawMessage.slice(0, 200)}`);
  }

  if (message?.type !== DEEPGRAM_RESULTS_TYPE) return null;
  const text = message.channel?.alternatives?.[0]?.transcript;
  if (typeof text !== 'string' || !text.trim()) return null;
  return { text: text.trim(), isFinal: message.is_final === true };
}
