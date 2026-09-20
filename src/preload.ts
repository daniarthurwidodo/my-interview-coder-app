// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from './constants';
import { ElectronApi } from './transcription/types';

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const electronApi: ElectronApi = {
  captureScreens: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_SCREENS),
  startTranscription: () => ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTION_START),
  stopTranscription: () => ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTION_STOP),
  sendAudioChunk: (chunk) => ipcRenderer.send(IPC_CHANNELS.TRANSCRIPTION_AUDIO, chunk),
  onTranscript: (listener) => subscribe(IPC_CHANNELS.TRANSCRIPT, listener),
  onTranscriptionError: (listener) => subscribe(IPC_CHANNELS.TRANSCRIPTION_ERROR, listener),
};

contextBridge.exposeInMainWorld('electronAPI', electronApi);
