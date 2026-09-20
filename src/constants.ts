export const IPC_CHANNELS = {
  CAPTURE_SCREENS: 'screens:capture',
} as const;

export const AUDIO_STATUS = {
  IDLE: 'Idle',
  PLAYING: 'Audio playing',
  SILENT: 'Silent',
} as const;

export const LISTEN_LABEL = {
  START: 'Start listening',
  STOP: 'Stop listening',
} as const;

export const AUDIO_FFT_SIZE = 2048;
export const SILENCE_RMS_THRESHOLD = 0.01;
export const WAVEFORM_LINE_WIDTH = 2;
export const WAVEFORM_COLOR = '#2b7cff';
export const WAVEFORM_BACKGROUND_COLOR = '#111';
