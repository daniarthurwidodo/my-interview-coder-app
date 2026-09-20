import { ChatMessage } from './types';

const SYSTEM_PROMPT =
  'You analyze screenshots. Describe what is shown, then list the key points and any important text. ' +
  'Be concise and use short bullet points. Output only the analysis.';
const USER_PROMPT = 'Analyze this screenshot.';

export function buildScreenshotMessages(imageDataUrl: string): ChatMessage[] {
  if (!imageDataUrl) throw new Error('imageDataUrl is required');
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: USER_PROMPT },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ];
}
