/* The "Live" activity pill. The rotating lines are a fleet-activity aggregate
   (our code); cms holds only the "Live" label + a manual fallback line set. The
   first line is rendered server-side; enhance.ts rotates through data-feed. */
export function LivePill({ label, lines }: { label: string; lines: string[] }) {
  const first = lines[0] ?? "";
  return (
    <div class="feed" data-testid="live-pill">
      <span class="livedot" />
      <span class="lbl">{label}</span>
      <span class="txt" data-feed={JSON.stringify(lines)} dangerouslySetInnerHTML={{ __html: first }} />
    </div>
  );
}
