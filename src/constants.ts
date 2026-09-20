export const IPC_CHANNELS = {
  CAPTURE_SCREENS: 'screens:capture',
  TRANSCRIPTION_START: 'transcription:start',
  TRANSCRIPTION_STOP: 'transcription:stop',
  TRANSCRIPTION_AUDIO: 'transcription:audio',
  TRANSCRIPT: 'transcription:transcript',
  TRANSCRIPTION_ERROR: 'transcription:error',
} as const;

export const TRANSCRIPTION_SAMPLE_RATE = 16000;
export const PCM_CHUNK_MS = 100;
export const MS_PER_SECOND = 1000;
export const INT16_MAX = 0x7fff;
export const INT16_MIN_MAGNITUDE = 0x8000;

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
