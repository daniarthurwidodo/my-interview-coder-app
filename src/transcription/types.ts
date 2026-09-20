import { SummaryRequest } from '../summary/types';

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
}

export interface ElectronApi {
  captureScreens: () => Promise<string[]>;
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<void>;
  summarize: (request: SummaryRequest) => Promise<string>;
  sendAudioChunk: (chunk: ArrayBuffer) => void;
  onTranscript: (listener: (segment: TranscriptSegment) => void) => () => void;
  onTranscriptionError: (listener: (message: string) => void) => () => void;
}

export interface TranscriptionSession {
  open: () => Promise<void>;
  sendAudio: (chunk: ArrayBuffer) => void;
  close: () => void;
}
