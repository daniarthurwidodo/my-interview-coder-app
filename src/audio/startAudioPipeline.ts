import { startPcmStreaming } from './pcmStreamer';
import { startSystemAudioCapture } from './systemAudio';
import { startAudioMonitor } from './waveform';

export interface AudioPipeline {
  stop: () => Promise<void>;
}

export async function startAudioPipeline({
  canvas,
  onPlayingChange,
}: {
  canvas: HTMLCanvasElement;
  onPlayingChange: (isPlaying: boolean) => void;
}): Promise<AudioPipeline> {
  const session = await startSystemAudioCapture();
  const stopMonitor = startAudioMonitor({ analyser: session.analyser, canvas, onPlayingChange });
  let stopPcmStreaming = () => {};

  const stop = async () => {
    stopMonitor();
    stopPcmStreaming();
    await window.electronAPI.stopTranscription();
    await session.stop();
  };

  try {
    await window.electronAPI.startTranscription();
    stopPcmStreaming = await startPcmStreaming({
      audioContext: session.audioContext,
      source: session.source,
      onChunk: window.electronAPI.sendAudioChunk,
    });
  } catch (error) {
    await stop();
    throw error;
  }
  return { stop };
}
