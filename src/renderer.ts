/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { startPcmStreaming } from './audio/pcmStreamer';
import { startSystemAudioCapture } from './audio/systemAudio';
import { startAudioMonitor } from './audio/waveform';
import { AUDIO_STATUS, LISTEN_LABEL } from './constants';
import { createRollingSummarizer } from './summary/rollingSummarizer';
import { ElectronApi, TranscriptSegment } from './transcription/types';

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}

const captureButton = document.getElementById('capture-button') as HTMLButtonElement;
const capturePreviews = document.getElementById('capture-previews') as HTMLDivElement;
const captureError = document.getElementById('capture-error') as HTMLParagraphElement;

function createPreviewImage(dataUrl: string, index: number): HTMLImageElement {
  const image = document.createElement('img');
  image.src = dataUrl;
  image.alt = `Screenshot of screen ${index + 1}`;
  return image;
}

const screenshotAnalysis = document.getElementById('screenshot-analysis') as HTMLDivElement;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function analyzeScreenshots(screenshots: string[]): Promise<void> {
  const resultElements = screenshots.map((_, index) => {
    const element = document.createElement('p');
    element.textContent = `Screen ${index + 1}: analyzing...`;
    return element;
  });
  screenshotAnalysis.replaceChildren(...resultElements);

  for (let i = 0; i < screenshots.length; i++) {
    try {
      const analysis = await window.electronAPI.analyzeScreenshot(screenshots[i]);
      resultElements[i].textContent = `Screen ${i + 1}:\n${analysis}`;
    } catch (error) {
      resultElements[i].textContent = `Screen ${i + 1}: analysis failed: ${toErrorMessage(error)}`;
    }
  }
}

async function handleCaptureClick(): Promise<void> {
  captureButton.disabled = true;
  captureError.textContent = '';
  try {
    const screenshots = await window.electronAPI.captureScreens();
    capturePreviews.replaceChildren(...screenshots.map(createPreviewImage));
    await analyzeScreenshots(screenshots);
  } catch (error) {
    captureError.textContent = `Screenshot failed: ${toErrorMessage(error)}`;
  } finally {
    captureButton.disabled = false;
  }
}

captureButton.addEventListener('click', handleCaptureClick);

const listenButton = document.getElementById('listen-button') as HTMLButtonElement;
const audioStatus = document.getElementById('audio-status') as HTMLSpanElement;
const listenError = document.getElementById('listen-error') as HTMLParagraphElement;
const waveformCanvas = document.getElementById('waveform') as HTMLCanvasElement;

const transcriptFinal = document.getElementById('transcript-final') as HTMLDivElement;
const transcriptInterim = document.getElementById('transcript-interim') as HTMLParagraphElement;

const summaryText = document.getElementById('summary-text') as HTMLParagraphElement;

let stopListening: (() => Promise<void>) | null = null;

function showListenError(prefix: string, message: string): void {
  listenError.textContent = `${prefix}: ${message}`;
}

const summarizer = createRollingSummarizer({
  summarize: window.electronAPI.summarize,
  onSummary: (summary) => {
    summaryText.textContent = summary;
  },
  onError: (message) => showListenError('Summary error', message),
});

function renderTranscriptSegment({ text, isFinal }: TranscriptSegment): void {
  if (!isFinal) {
    transcriptInterim.textContent = text;
    return;
  }
  transcriptInterim.textContent = '';
  const line = document.createElement('p');
  line.textContent = text;
  transcriptFinal.append(line);
  summarizer.addText(text);
}

window.electronAPI.onTranscript(renderTranscriptSegment);
window.electronAPI.onTranscriptionError((message) =>
  showListenError('Transcription error', message),
);

async function startListening(): Promise<void> {
  const session = await startSystemAudioCapture();
  const stopMonitor = startAudioMonitor({
    analyser: session.analyser,
    canvas: waveformCanvas,
    onPlayingChange: (isPlaying) => {
      audioStatus.textContent = isPlaying ? AUDIO_STATUS.PLAYING : AUDIO_STATUS.SILENT;
    },
  });
  let stopPcmStreaming = () => {};
  const teardown = async () => {
    stopMonitor();
    stopPcmStreaming();
    await window.electronAPI.stopTranscription();
    await summarizer.stop();
    await session.stop();
    audioStatus.textContent = AUDIO_STATUS.IDLE;
    transcriptInterim.textContent = '';
  };

  try {
    transcriptFinal.replaceChildren();
    summaryText.textContent = '';
    summarizer.start();
    await window.electronAPI.startTranscription();
    stopPcmStreaming = await startPcmStreaming({
      audioContext: session.audioContext,
      source: session.source,
      onChunk: window.electronAPI.sendAudioChunk,
    });
  } catch (error) {
    await teardown();
    throw error;
  }
  stopListening = teardown;
  listenButton.textContent = LISTEN_LABEL.STOP;
}

async function handleListenClick(): Promise<void> {
  listenButton.disabled = true;
  listenError.textContent = '';
  try {
    if (stopListening) {
      await stopListening();
      stopListening = null;
      listenButton.textContent = LISTEN_LABEL.START;
    } else {
      await startListening();
    }
  } catch (error) {
    showListenError(
      'Audio capture failed',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    listenButton.disabled = false;
  }
}

listenButton.addEventListener('click', handleListenClick);
