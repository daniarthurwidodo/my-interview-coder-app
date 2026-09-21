import { ElectronApi } from './transcription/types';

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}
