import { app, ipcMain, WebContents } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from '../constants';
import { SherpaSession } from './sherpaSession';
import { TranscriptionSession } from './types';

const MODELS_DIR_NAME = 'models';
const SPEECH_MODEL_DIR_NAME = 'sherpa-onnx-streaming-zipformer-en-2023-06-26';

let activeSession: TranscriptionSession | null = null;

function sendToRenderer(target: WebContents, channel: string, payload: unknown): void {
  if (target.isDestroyed()) return;
  target.send(channel, payload);
}

async function startTranscription(target: WebContents): Promise<void> {
  if (activeSession) throw new Error('Transcription is already running');

  const session = new SherpaSession({
    modelDir: path.join(app.getAppPath(), MODELS_DIR_NAME, SPEECH_MODEL_DIR_NAME),
    onTranscript: (segment) => sendToRenderer(target, IPC_CHANNELS.TRANSCRIPT, segment),
    onError: (message) => sendToRenderer(target, IPC_CHANNELS.TRANSCRIPTION_ERROR, message),
  });
  await session.open();
  activeSession = session;
}

function stopTranscription(): void {
  activeSession?.close();
  activeSession = null;
}

export function registerTranscriptionIpc(): void {
  ipcMain.handle(IPC_CHANNELS.TRANSCRIPTION_START, (event) => startTranscription(event.sender));
  ipcMain.handle(IPC_CHANNELS.TRANSCRIPTION_STOP, stopTranscription);
  ipcMain.on(IPC_CHANNELS.TRANSCRIPTION_AUDIO, (_event, chunk: ArrayBuffer) => {
    activeSession?.sendAudio(chunk);
  });
}
