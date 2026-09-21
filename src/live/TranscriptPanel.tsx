interface TranscriptPanelProps {
  lines: string[];
  interimText: string;
}

export function TranscriptPanel({ lines, interimText }: TranscriptPanelProps) {
  return (
    <>
      <h2>Transcript</h2>
      <div id="transcript-final">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      <p id="transcript-interim">{interimText}</p>
    </>
  );
}
