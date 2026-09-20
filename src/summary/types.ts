export interface SummaryRequest {
  previousSummary: string;
  newText: string;
}

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: 'system' | 'user';
  content: string | ChatContentPart[];
}
