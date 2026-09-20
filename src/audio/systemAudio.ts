import { AUDIO_FFT_SIZE, TRANSCRIPTION_SAMPLE_RATE } from '../constants';

export interface SystemAudioSession {
  audioContext: AudioContext;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  stop: () => Promise<void>;
}

export async function startSystemAudioCapture(): Promise<SystemAudioSession> {
  // Main process handler requires a video source; only the audio track is kept.
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
  stream.getVideoTracks().forEach((track) => track.stop());
  if (!stream.getAudioTracks().length) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('No system audio track available');
  }

  const audioContext = new AudioContext({ sampleRate: TRANSCRIPTION_SAMPLE_RATE });
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = AUDIO_FFT_SIZE;
  source.connect(analyser);

  return {
    audioContext,
    source,
    analyser,
    stop: async () => {
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close();
    },
  };
}
