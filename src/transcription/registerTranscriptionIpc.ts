import { ipcMain, WebContents } from 'electron';
import { IPC_CHANNELS } from '../constants';
import { DeepgramSession } from './deepgramSession';

const API_KEY_ENV_NAME = 'DEEPGRAM_API_KEY';

let activeSession: DeepgramSession | null = null;

function sendToRenderer(target: WebContents, channel: string, payload: unknown): void {
  if (target.isDestroyed()) return;
  target.send(channel, payload);
}

async function startTranscription(target: WebContents): Promise<void> {
  if (activeSession) throw new Error('Transcription is already running');
  const apiKey = process.env[API_KEY_ENV_NAME];
  if (!apiKey) throw new Error(`${API_KEY_ENV_NAME} is not set`);

  const session = new DeepgramSession({
    apiKey,
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
