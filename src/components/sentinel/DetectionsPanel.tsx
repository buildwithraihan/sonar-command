import { useMemo, useState } from "react";
import type { Detection } from "@/lib/sentinel";

const RANK: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "HIGH"
      ? "border-prio-high/70 text-prio-high bg-prio-high/10"
      : priority === "MEDIUM"
        ? "border-prio-medium/70 text-prio-medium bg-prio-medium/10"
        : "border-prio-low/70 text-prio-low bg-prio-low/10";
  return (
    <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-widest ${cls}`}>
      {priority}
    </span>
  );
}

export function DetectionsPanel({ detections }: { detections: Detection[] }) {
  const [sort, setSort] = useState<"confidence" | "priority">("confidence");
  const [dir, setDir] = useState<"desc" | "asc">("desc");

  const rows = useMemo(() => {
    const copy = [...detections];
    copy.sort((a, b) => {
      const va = sort === "confidence" ? a.confidence : (RANK[a.priority] ?? 0);
      const vb = sort === "confidence" ? b.confidence : (RANK[b.priority] ?? 0);
      return dir === "desc" ? vb - va : va - vb;
    });
    return copy;
  }, [detections, sort, dir]);

  const toggle = (key: "confidence" | "priority") => {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const arrow = (key: string) => (sort === key ? (dir === "desc" ? " ▼" : " ▲") : "");

  return (
    <section className="panel p-4">
      <h2 className="label-tac mb-3 text-primary">[ Detection Log ]</h2>
      {detections.length === 0 ? (
        <p className="label-tac py-6 text-center">No contacts registered</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="label-tac py-2 pr-3">Class</th>
                <th className="label-tac cursor-pointer py-2 pr-3" onClick={() => toggle("confidence")}>
                  Conf{arrow("confidence")}
                </th>
                <th className="label-tac py-2 pr-3">Category</th>
                <th className="label-tac py-2 pr-3">Quality</th>
                <th className="label-tac cursor-pointer py-2" onClick={() => toggle("priority")}>
                  Priority{arrow("priority")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-panel-raised/60">
                  <td className="py-2 pr-3 uppercase tracking-widest text-foreground">{d.class}</td>
                  <td className="py-2 pr-3 text-primary">{(d.confidence * 100).toFixed(1)}%</td>
                  <td className="py-2 pr-3 uppercase tracking-wider text-muted-foreground">
                    {d.category}
                  </td>
                  <td className="py-2 pr-3 uppercase tracking-wider text-muted-foreground">
                    {d.detection_quality}
                  </td>
                  <td className="py-2">
                    <PriorityBadge priority={d.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
