import { TRANSCRIPTION_SAMPLE_RATE } from '../constants';
import { parseTranscriptMessage } from './parseTranscript';
import { TranscriptSegment } from './types';

const DEEPGRAM_LISTEN_URL = 'wss://api.deepgram.com/v1/listen';
const DEEPGRAM_AUTH_PROTOCOL = 'token';
const DEEPGRAM_CLOSE_STREAM_MESSAGE = JSON.stringify({ type: 'CloseStream' });
const DEEPGRAM_QUERY = new URLSearchParams({
  model: 'nova-3',
  language: 'en',
  encoding: 'linear16',
  sample_rate: String(TRANSCRIPTION_SAMPLE_RATE),
  channels: '1',
  interim_results: 'true',
  smart_format: 'true',
});

interface DeepgramSessionOptions {
  apiKey: string;
  onTranscript: (segment: TranscriptSegment) => void;
  onError: (message: string) => void;
}

export class DeepgramSession {
  private socket: WebSocket | null = null;
  private isClosingByUs = false;

  constructor(private readonly options: DeepgramSessionOptions) {
    if (!options.apiKey) throw new Error('Deepgram API key is required');
  }

  async open(): Promise<void> {
    const socket = new WebSocket(
      `${DEEPGRAM_LISTEN_URL}?${DEEPGRAM_QUERY.toString()}`,
      [DEEPGRAM_AUTH_PROTOCOL, this.options.apiKey],
    );
    socket.binaryType = 'arraybuffer';
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error('Could not connect to Deepgram'));
    });
    socket.onerror = () => this.options.onError('Deepgram connection error');
    socket.onmessage = (event) => this.handleMessage(event.data);
    socket.onclose = (event) => this.handleClose(event);
    this.socket = socket;
  }

  sendAudio(chunk: ArrayBuffer): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(chunk);
  }

  close(): void {
    if (!this.socket) return;
    this.isClosingByUs = true;
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(DEEPGRAM_CLOSE_STREAM_MESSAGE);
    }
    this.socket.close();
    this.socket = null;
  }

  private handleMessage(rawMessage: unknown): void {
    try {
      const segment = parseTranscriptMessage(rawMessage);
      if (segment) this.options.onTranscript(segment);
    } catch (error) {
      this.options.onError(error instanceof Error ? error.message : String(error));
    }
  }

  private handleClose(event: CloseEvent): void {
    if (this.isClosingByUs) return;
    this.socket = null;
    this.options.onError(`Deepgram closed the connection (${event.code} ${event.reason})`);
  }
}
