interface CaptureControlsProps {
  screenshots: string[];
  captureError: string;
  isBusy: boolean;
  onCapture: () => void;
}

export function CaptureControls({ screenshots, captureError, isBusy, onCapture }: CaptureControlsProps) {
  return (
    <>
      <button id="capture-button" type="button" disabled={isBusy} onClick={onCapture}>
        Capture screenshot
      </button>
      <p id="capture-error" role="alert">{captureError}</p>
      <div id="capture-previews">
        {screenshots.map((dataUrl, index) => (
          <img key={index} src={dataUrl} alt={`Screenshot of screen ${index + 1}`} />
        ))}
      </div>
    </>
  );
}
