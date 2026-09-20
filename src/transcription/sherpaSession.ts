import fs from 'node:fs';
import path from 'node:path';
import { OnlineRecognizer, OnlineStream } from 'sherpa-onnx-node';
import {
  INT16_MIN_MAGNITUDE,
  MS_PER_SECOND,
  TRANSCRIPTION_SAMPLE_RATE,
} from '../constants';
import { TranscriptionSession, TranscriptSegment } from './types';

const MODEL_FILE_SUFFIX = 'epoch-99-avg-1-chunk-16-left-128.int8.onnx';
const FEATURE_DIM = 80;
const NUM_THREADS = 2;
const TAIL_PADDING_MS = 400;
const DOWNLOAD_HINT = 'Run "npm run download-model" first.';

interface SherpaSessionOptions {
  modelDir: string;
  onTranscript: (segment: TranscriptSegment) => void;
  onError: (message: string) => void;
}

export function toSentenceCase(text: string): string {
  const lowerCased = text.trim().toLowerCase();
  return lowerCased.charAt(0).toUpperCase() + lowerCased.slice(1);
}

function pcm16ToFloat32(chunk: ArrayBuffer): Float32Array {
  const pcm = new Int16Array(chunk);
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    samples[i] = pcm[i] / INT16_MIN_MAGNITUDE;
  }
  return samples;
}

export class SherpaSession implements TranscriptionSession {
  private recognizer: OnlineRecognizer | null = null;
  private stream: OnlineStream | null = null;
  private lastInterimText = '';

  constructor(private readonly options: SherpaSessionOptions) {
    if (!options.modelDir) throw new Error('Model directory is required');
  }

  async open(): Promise<void> {
    const modelFile = (name: string) =>
      path.join(this.options.modelDir, `${name}-${MODEL_FILE_SUFFIX}`);
    const tokensPath = path.join(this.options.modelDir, 'tokens.txt');
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`Speech model not found at ${this.options.modelDir}. ${DOWNLOAD_HINT}`);
    }

    this.recognizer = new OnlineRecognizer({
      featConfig: { sampleRate: TRANSCRIPTION_SAMPLE_RATE, featureDim: FEATURE_DIM },
      modelConfig: {
        transducer: {
          encoder: modelFile('encoder'),
          decoder: modelFile('decoder'),
          joiner: modelFile('joiner'),
        },
        tokens: tokensPath,
        numThreads: NUM_THREADS,
        provider: 'cpu',
      },
      enableEndpoint: true,
    });
    this.stream = this.recognizer.createStream();
  }

  sendAudio(chunk: ArrayBuffer): void {
    if (!this.recognizer || !this.stream) return;
    try {
      this.feed(pcm16ToFloat32(chunk));
      this.emitInterimOrFinal();
    } catch (error) {
      this.options.onError(error instanceof Error ? error.message : String(error));
    }
  }

  close(): void {
    if (!this.recognizer || !this.stream) return;
    try {
      const tailSamples = (TRANSCRIPTION_SAMPLE_RATE * TAIL_PADDING_MS) / MS_PER_SECOND;
      this.feed(new Float32Array(tailSamples));
      this.emitText(this.currentText(), true);
    } catch (error) {
      this.options.onError(error instanceof Error ? error.message : String(error));
    } finally {
      this.recognizer = null;
      this.stream = null;
    }
  }

  private feed(samples: Float32Array): void {
    this.stream!.acceptWaveform({ sampleRate: TRANSCRIPTION_SAMPLE_RATE, samples });
    while (this.recognizer!.isReady(this.stream!)) {
      this.recognizer!.decode(this.stream!);
    }
  }

  private currentText(): string {
    return this.recognizer!.getResult(this.stream!).text.trim();
  }

  private emitInterimOrFinal(): void {
    const text = this.currentText();
    if (this.recognizer!.isEndpoint(this.stream!)) {
      this.emitText(text, true);
      this.recognizer!.reset(this.stream!);
      return;
    }
    if (text !== this.lastInterimText) this.emitText(text, false);
  }

  private emitText(text: string, isFinal: boolean): void {
    this.lastInterimText = isFinal ? '' : text;
    if (!text) return;
    this.options.onTranscript({ text: toSentenceCase(text), isFinal });
  }
}
