// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './constants';

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreens: (): Promise<string[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_SCREENS),
});
