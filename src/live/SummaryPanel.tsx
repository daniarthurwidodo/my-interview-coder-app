export function SummaryPanel({ summary }: { summary: string }) {
  return (
    <>
      <h2>Summary</h2>
      <p id="summary-text">{summary}</p>
    </>
  );
}
