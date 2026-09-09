import type { AnalyzeResponse } from "@/lib/sentinel";

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="panel min-w-[120px] flex-1 px-3 py-2">
      <p className="label-tac">{label}</p>
      <p className={`text-2xl leading-tight ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function AnalyticsBar({ result }: { result: AnalyzeResponse }) {
  const by = (p: string) => result.detections.filter((d) => d.priority === p).length;
  const classes = Array.from(new Set(result.detections.map((d) => d.class)));

  return (
    <section>
      <h2 className="label-tac mb-2 text-primary">[ Batch Analytics Summary ]</h2>
      <div className="flex flex-wrap gap-2">
        <Stat label="Total Contacts" value={result.total_detections} tone="text-primary" />
        <Stat label="High Priority" value={by("HIGH")} tone="text-prio-high" />
        <Stat label="Medium Priority" value={by("MEDIUM")} tone="text-prio-medium" />
        <Stat label="Low Priority" value={by("LOW")} tone="text-prio-low" />
        {classes.map((c) => (
          <Stat
            key={c}
            label={c}
            value={result.detections.filter((d) => d.class === c).length}
          />
        ))}
      </div>
    </section>
  );
}
