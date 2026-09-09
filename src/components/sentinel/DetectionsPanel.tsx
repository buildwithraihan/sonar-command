import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

export function DetectionsPanel({ detections, selected, onSelect }: { detections: Detection[]; selected: Detection | null; onSelect: (d: Detection) => void }) {
  const [sort, setSort] = useState<"confidence" | "priority">("confidence");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [minimum, setMinimum] = useState(0);

  const rows = useMemo(() => {
    const copy = detections.filter((d) =>
      d.class.toLowerCase().includes(query.toLowerCase()) &&
      (priority === "ALL" || d.priority === priority) &&
      d.confidence * 100 >= minimum,
    );
    copy.sort((a, b) => {
      const va = sort === "confidence" ? a.confidence : (RANK[a.priority] ?? 0);
      const vb = sort === "confidence" ? b.confidence : (RANK[b.priority] ?? 0);
      return dir === "desc" ? vb - va : va - vb;
    });
    return copy;
  }, [detections, sort, dir, query, priority, minimum]);

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
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_120px_180px]">
        <label className="flex items-center gap-2 border border-border bg-background/60 px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input aria-label="Search detections by class" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="SEARCH CLASS" className="h-8 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" />
        </label>
        <select aria-label="Filter detections by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-8 border border-border bg-background px-2 text-[10px] uppercase text-foreground">
          <option>ALL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>
        <label className="flex items-center gap-2 border border-border bg-background/60 px-2 text-[10px] uppercase text-muted-foreground">
          Min {minimum}%
          <input aria-label="Minimum confidence" type="range" min="0" max="100" step="5" value={minimum} onChange={(e) => setMinimum(Number(e.target.value))} className="min-w-0 flex-1 accent-primary" />
        </label>
      </div>
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
                <tr key={i} onClick={() => onSelect(d)} className={`cursor-pointer border-b border-border/50 hover:bg-panel-raised/60 ${selected === d ? "bg-primary/10" : ""}`}>
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
