import { Activity, AlertTriangle, CheckCircle2, Clock3, FileImage } from "lucide-react";
import type { Detection, SessionRun } from "@/lib/sentinel";
import { PriorityBadge } from "./DetectionsPanel";

export function ClassificationMatrix({ detection }: { detection: Detection | null }) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <h2 className="label-tac text-primary">[ Neural Classification Matrix ]</h2>
        <span className="status-chip border-prio-low/40 text-prio-low">YOLO LINK</span>
      </div>
      {!detection ? (
        <div className="flex min-h-44 items-center justify-center text-center">
          <p className="label-tac max-w-64">Select a returned detection to inspect its classification</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label-tac">Classification</p>
              <p className="mt-1 font-display text-3xl font-semibold uppercase text-foreground">{detection.class}</p>
            </div>
            <p className="font-display text-5xl font-semibold text-signal">{(detection.confidence * 100).toFixed(1)}<span className="text-lg">%</span></p>
          </div>
          <div className="matrix-grid" aria-hidden="true"><span style={{ width: `${detection.confidence * 100}%` }} /></div>
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-panel p-3"><p className="label-tac">Threat Classification</p><div className="mt-2"><PriorityBadge priority={detection.priority} /></div></div>
            <div className="bg-panel p-3"><p className="label-tac">Detection Quality</p><p className="mt-2 text-xs font-semibold uppercase text-foreground">{detection.detection_quality}</p></div>
            <div className="col-span-2 bg-panel p-3"><p className="label-tac">Category</p><p className="mt-2 text-xs font-semibold uppercase text-primary">{detection.category}</p></div>
          </div>
        </div>
      )}
    </section>
  );
}

export function SessionLog({ runs }: { runs: SessionRun[] }) {
  return (
    <section className="panel flex min-h-56 flex-col p-4">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <h2 className="label-tac text-primary">[ Detection Log // Session ]</h2>
        <span className="label-tac">{runs.length} Runs</span>
      </div>
      {!runs.length ? <p className="label-tac m-auto">No analyses recorded this session</p> : (
        <div className="space-y-px overflow-auto">
          {runs.map((run) => (
            <div key={run.id} className="grid grid-cols-[74px_1fr_auto] items-center gap-3 border-l-2 border-primary/50 bg-background/35 px-3 py-2 text-[11px]">
              <span className="text-muted-foreground">{new Date(run.timestamp).toLocaleTimeString([], { hour12: false })}</span>
              <span className="min-w-0 truncate text-foreground"><FileImage className="mr-2 inline h-3 w-3 text-primary" />{run.filename}</span>
              <span className="flex items-center gap-3"><b className="text-primary">{run.result.total_detections}</b><PriorityBadge priority={run.highestPriority} /></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Telemetry({ status, lastMs, total }: { status: string; lastMs: number | null; total: number }) {
  const live = status === "LIVE";
  return (
    <section className="panel p-4">
      <h2 className="label-tac mb-3 border-b border-border pb-2 text-primary">[ System Telemetry ]</h2>
      <div className="space-y-px">
        <TelemetryRow icon={live ? CheckCircle2 : AlertTriangle} label="Backend Link" value={status} tone={live ? "text-signal" : "text-prio-medium"} />
        <TelemetryRow icon={Clock3} label="Last Response" value={lastMs === null ? "—" : `${lastMs} MS`} />
        <TelemetryRow icon={Activity} label="Model" value="YOLOv8n // 3 CLASSES // mAP50 0.84" />
        <TelemetryRow icon={FileImage} label="Images Analyzed" value={String(total)} />
      </div>
    </section>
  );
}

function TelemetryRow({ icon: Icon, label, value, tone = "text-foreground" }: { icon: typeof Activity; label: string; value: string; tone?: string }) {
  return <div className="grid grid-cols-[20px_110px_1fr] items-center gap-2 bg-background/35 px-3 py-2 text-[10px]"><Icon className="h-3.5 w-3.5 text-primary" /><span className="uppercase text-muted-foreground">{label}</span><span className={`text-right font-semibold ${tone}`}>{value}</span></div>;
}