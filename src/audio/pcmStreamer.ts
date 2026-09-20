import {
  INT16_MAX,
  INT16_MIN_MAGNITUDE,
  MS_PER_SECOND,
  PCM_CHUNK_MS,
  TRANSCRIPTION_SAMPLE_RATE,
} from '../constants';

const PCM_WORKLET_NAME = 'pcm-chunker';
const PCM_CHUNK_SAMPLES = (TRANSCRIPTION_SAMPLE_RATE * PCM_CHUNK_MS) / MS_PER_SECOND;

// Runs on the audio thread, so it is shipped as source text and loaded via a Blob URL.
const PCM_WORKLET_SOURCE = `
class PcmChunker extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(${PCM_CHUNK_SAMPLES});
    this.length = 0;
  }
  process(inputs) {
    const channel = inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      const clamped = Math.max(-1, Math.min(1, channel[i]));
      this.buffer[this.length++] = clamped < 0 ? clamped * ${INT16_MIN_MAGNITUDE} : clamped * ${INT16_MAX};
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
        this.buffer = new Int16Array(${PCM_CHUNK_SAMPLES});
        this.length = 0;
      }
    }
    return true;
  }
}
registerProcessor('${PCM_WORKLET_NAME}', PcmChunker);
`;

async function loadPcmWorklet(audioContext: AudioContext): Promise<void> {
  const blobUrl = URL.createObjectURL(
    new Blob([PCM_WORKLET_SOURCE], { type: 'application/javascript' }),
  );
  try {
    await audioContext.audioWorklet.addModule(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function startPcmStreaming({
  audioContext,
  source,
  onChunk,
}: {
  audioContext: AudioContext;
  source: MediaStreamAudioSourceNode;
  onChunk: (chunk: ArrayBuffer) => void;
}): Promise<() => void> {
  await loadPcmWorklet(audioContext);
  const chunker = new AudioWorkletNode(audioContext, PCM_WORKLET_NAME, {
    channelCount: 1,
    channelCountMode: 'explicit',
  });
  chunker.port.onmessage = (event: MessageEvent<ArrayBuffer>) => onChunk(event.data);

  // Muted sink keeps the worklet pulled by the graph without playing audio back.
  const mutedSink = audioContext.createGain();
  mutedSink.gain.value = 0;
  source.connect(chunker);
  chunker.connect(mutedSink);
  mutedSink.connect(audioContext.destination);

  return () => {
    chunker.port.onmessage = null;
    source.disconnect(chunker);
    chunker.disconnect();
    mutedSink.disconnect();
  };
}
