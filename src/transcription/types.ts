export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
}

export interface ElectronApi {
  captureScreens: () => Promise<string[]>;
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<void>;
  sendAudioChunk: (chunk: ArrayBuffer) => void;
  onTranscript: (listener: (segment: TranscriptSegment) => void) => () => void;
  onTranscriptionError: (listener: (message: string) => void) => () => void;
}
