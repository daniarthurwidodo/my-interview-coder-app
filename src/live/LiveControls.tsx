import { RefObject } from 'react';
import { AUDIO_STATUS, LISTEN_LABEL } from '../constants';
import { AudioStatusKey } from './useLiveSession';

const WAVEFORM_WIDTH_PX = 600;
const WAVEFORM_HEIGHT_PX = 120;

interface LiveControlsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isListening: boolean;
  isBusy: boolean;
  audioStatus: AudioStatusKey;
  errorMessage: string;
  onToggle: () => void;
}

export function LiveControls({
  canvasRef,
  isListening,
  isBusy,
  audioStatus,
  errorMessage,
  onToggle,
}: LiveControlsProps) {
  return (
    <>
      <button id="listen-button" type="button" disabled={isBusy} onClick={onToggle}>
        {isListening ? LISTEN_LABEL.STOP : LISTEN_LABEL.START}
      </button>
      <span id="audio-status">{AUDIO_STATUS[audioStatus]}</span>
      <p id="listen-error" role="alert">{errorMessage}</p>
      <canvas id="waveform" ref={canvasRef} width={WAVEFORM_WIDTH_PX} height={WAVEFORM_HEIGHT_PX} />
    </>
  );
}
