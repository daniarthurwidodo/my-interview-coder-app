import { AUDIO_FFT_SIZE } from '../constants';

export interface SystemAudioSession {
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

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = AUDIO_FFT_SIZE;
  audioContext.createMediaStreamSource(stream).connect(analyser);

  return {
    analyser,
    stop: async () => {
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close();
    },
  };
}
