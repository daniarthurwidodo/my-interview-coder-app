import {
  SILENCE_RMS_THRESHOLD,
  WAVEFORM_BACKGROUND_COLOR,
  WAVEFORM_COLOR,
  WAVEFORM_LINE_WIDTH,
} from '../constants';

export function calculateRms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sumOfSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumOfSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumOfSquares / samples.length);
}

export function isAudioPlaying(rms: number): boolean {
  return rms > SILENCE_RMS_THRESHOLD;
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  samples: Float32Array,
): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');

  const { width, height } = canvas;
  context.fillStyle = WAVEFORM_BACKGROUND_COLOR;
  context.fillRect(0, 0, width, height);
  context.lineWidth = WAVEFORM_LINE_WIDTH;
  context.strokeStyle = WAVEFORM_COLOR;
  context.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const x = (i / (samples.length - 1)) * width;
    const y = ((1 - samples[i]) / 2) * height;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

export function startAudioMonitor({
  analyser,
  canvas,
  onPlayingChange,
}: {
  analyser: AnalyserNode;
  canvas: HTMLCanvasElement;
  onPlayingChange: (isPlaying: boolean) => void;
}): () => void {
  const samples = new Float32Array(analyser.fftSize);
  let animationFrameId = 0;
  let wasPlaying: boolean | null = null;

  const renderFrame = () => {
    analyser.getFloatTimeDomainData(samples);
    drawWaveform(canvas, samples);
    const isPlaying = isAudioPlaying(calculateRms(samples));
    if (isPlaying !== wasPlaying) onPlayingChange(isPlaying);
    wasPlaying = isPlaying;
    animationFrameId = requestAnimationFrame(renderFrame);
  };
  renderFrame();

  return () => cancelAnimationFrame(animationFrameId);
}
