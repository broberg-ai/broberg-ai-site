/* A single count-up stat. The number animates client-side (enhance.ts reads the
   data-* attributes); the rendered "0" + final value are both meaningful, so it
   degrades gracefully without JS. The target/label come from cms (or, later, a
   live fleet aggregate); cms holds the manual fallback target. */
import type { Stat } from "@/content/types.ts";

export function CountUp({ stat }: { stat: Stat }) {
  return (
    <div class="stat">
      <div
        class="n"
        data-testid="stat-countup"
        data-target={String(stat.target)}
        data-pre={stat.pre ?? ""}
        data-suf={stat.suf ?? ""}
      >
        0
      </div>
      <div class="l">{stat.label}</div>
    </div>
  );
}
