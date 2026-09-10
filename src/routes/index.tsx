import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UploadPanel } from "@/components/sentinel/UploadPanel";
import { SonarViewer } from "@/components/sentinel/SonarViewer";
import { DetectionsPanel } from "@/components/sentinel/DetectionsPanel";
import { AnalyticsBar } from "@/components/sentinel/AnalyticsBar";
import { IconRail } from "@/components/sentinel/IconRail";
import { ClassificationMatrix, SessionLog, Telemetry } from "@/components/sentinel/CommandPanels";
import {
  analyzeImage,
  combineResults,
  downloadFile,
  exportSessionPDF,
  highestPriority,
  toCSV,
  type AnalyzeResponse,
  type Detection,
  type SessionRun,
} from "@/lib/sentinel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SENTINEL — Underwater Sonar Anomaly Detection" },
      {
        name: "description",
        content:
          "SENTINEL analyzes sonar imagery for underwater anomalies, flagging ship, aircraft and human contacts with priority-ranked detections.",
      },
      { property: "og:title", content: "SENTINEL — Underwater Intelligence System" },
      {
        property: "og:description",
        content:
          "AI-powered sonar anomaly detection console with bounding-box overlays, priority triage and CSV/JSON/PDF export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sentinel,
});

type Status = "STANDBY" | "ANALYZING" | "COMPLETE" | "ERROR";

const STATUS_TONE: Record<Status, string> = {
  STANDBY: "text-muted-foreground",
  ANALYZING: "text-prio-medium",
  COMPLETE: "text-signal",
  ERROR: "text-prio-high",
};

function Sentinel() {
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selected, setSelected] = useState<Detection | null>(null);
  const [runs, setRuns] = useState<SessionRun[]>([]);
  const [status, setStatus] = useState<Status>("STANDBY");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [coldStart, setColdStart] = useState(false);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const selectFiles = (incoming: File[]) => {
    setFiles(incoming);
    setResult(null);
    setSelected(null);
    setError(null);
    setCompleted(0);
    setStatus("STANDBY");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = incoming[0] ? URL.createObjectURL(incoming[0]) : null;
    setImageUrl(urlRef.current);
  };

  const run = async () => {
    if (!files.length) return;
    setStatus("ANALYZING");
    setError(null);
    setResult(null);
    setSelected(null);
    setCompleted(0);
    setProgress(4);
    setColdStart(false);

    const started = Date.now();
    const tick = setInterval(() => {
      if (Date.now() - started > 6000) setColdStart(true);
      setProgress((p) => Math.min(p + (p < 60 ? 3 : 0.6), 95));
    }, 400);

    try {
      const batch: SessionRun[] = [];
      for (const file of files) {
        const t0 = Date.now();
        const data = await analyzeImage(file);
        const ms = Date.now() - t0;
        setLastMs(ms);
        batch.push({
          id: `${Date.now()}-${file.name}`,
          timestamp: new Date().toISOString(),
          filename: data.filename || file.name,
          responseMs: ms,
          highestPriority: highestPriority(data.detections),
          result: data,
        });
        setCompleted(batch.length);
      }
      setRuns((prev) => [...batch.reverse(), ...prev]);
      setResult(combineResults(batch));
      setProgress(100);
      setStatus("COMPLETE");
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN FAILURE");
      setStatus("ERROR");
    } finally {
      clearInterval(tick);
      setColdStart(false);
    }
  };

  const backend =
    status === "ERROR" ? "DEGRADED" : lastMs !== null ? "LIVE" : "IDLE";
  const totalDetections = runs.reduce((t, r) => t + r.result.total_detections, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.4em] text-primary">Sentinel</h1>
            <p className="label-tac">Underwater Intelligence System</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-chip">
              <i className={`h-2 w-2 ${backend === "LIVE" ? "bg-signal" : backend === "DEGRADED" ? "bg-prio-high" : "bg-muted-foreground"}`} />
              Node {backend}
            </span>
            <span className="status-chip">Runs {runs.length}</span>
            <span className="status-chip">Contacts {totalDetections}</span>
            <span className="status-chip">
              Last {runs[0] ? new Date(runs[0].timestamp).toLocaleTimeString([], { hour12: false }) : "—"}
            </span>
            <span className="status-chip text-primary">
              {clock.toISOString().slice(0, 10)} {clock.toLocaleTimeString([], { hour12: false })}Z
            </span>
            <span className={`status-chip ${STATUS_TONE[status]}`}>{status}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-4 px-5">
        <IconRail />

        <main className="min-w-0 flex-1 space-y-4 py-5">
          <section id="analytics">{result && <AnalyticsBar result={result} />}</section>

          <div className="grid gap-4 xl:grid-cols-[340px_1fr_340px]">
            <div id="upload" className="space-y-4">
              <UploadPanel
                files={files}
                onFiles={selectFiles}
                onRun={run}
                onRetry={run}
                loading={status === "ANALYZING"}
                progress={progress}
                completed={completed}
                coldStart={coldStart}
                error={error}
              />

              <section id="export" className="panel p-4">
                <h2 className="label-tac mb-3 text-primary">[ Export ]</h2>
                <div className="grid grid-cols-2 gap-2">
                  <ExportButton
                    disabled={!result}
                    label="Export CSV"
                    onClick={() => result && downloadFile(toCSV(result), `sentinel-${result.filename}.csv`, "text/csv")}
                  />
                  <ExportButton
                    disabled={!result}
                    label="Export JSON"
                    onClick={() =>
                      result &&
                      downloadFile(JSON.stringify(result, null, 2), `sentinel-${result.filename}.json`, "application/json")
                    }
                  />
                  <ExportButton
                    disabled={!runs.length}
                    label="Session PDF"
                    onClick={() => exportSessionPDF(runs)}
                  />
                  <ExportButton
                    disabled={!runs.length}
                    label="Session JSON"
                    onClick={() =>
                      downloadFile(JSON.stringify(runs, null, 2), `sentinel-session-${Date.now()}.json`, "application/json")
                    }
                  />
                </div>
              </section>

              <section id="settings" className="panel p-4">
                <h2 className="label-tac mb-3 text-primary">[ Endpoint ]</h2>
                <p className="break-all text-[11px] text-muted-foreground">
                  {import.meta.env["VITE_API_URL"] ?? "https://sentinel-2h7a.onrender.com"}/analyze
                </p>
                <p className="label-tac mt-2">Timeout 45s // multipart field: file</p>
              </section>
            </div>

            <div className="min-w-0 space-y-4">
              <SonarViewer imageUrl={result ? imageUrl : null} detections={result?.detections ?? []} />
              {result && (
                <DetectionsPanel detections={result.detections} selected={selected} onSelect={setSelected} />
              )}
            </div>

            <div className="space-y-4">
              <ClassificationMatrix detection={selected} />
              <Telemetry status={backend} lastMs={lastMs} total={runs.length} />
              <div id="history">
                <SessionLog runs={runs} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-border px-5 py-4 text-center">
        <p className="label-tac">Sentinel v1.0 — Classification: Restricted</p>
      </footer>
    </div>
  );
}

function ExportButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-border-bright hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:border-border"
    >
      {label}
    </button>
  );
}
