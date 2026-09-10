import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { UploadPanel } from "@/components/sentinel/UploadPanel";
import { SonarViewer } from "@/components/sentinel/SonarViewer";
import { DetectionsPanel } from "@/components/sentinel/DetectionsPanel";
import { AnalyticsBar } from "@/components/sentinel/AnalyticsBar";
import { analyzeImage, downloadFile, toCSV, type AnalyzeResponse, type Detection } from "@/lib/sentinel";

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
          "AI-powered sonar anomaly detection console with bounding-box overlays, priority triage and CSV/JSON export.",
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
  COMPLETE: "text-primary",
  ERROR: "text-prio-high",
};

function Sentinel() {
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selected, setSelected] = useState<Detection | null>(null);
  const [status, setStatus] = useState<Status>("STANDBY");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [coldStart, setColdStart] = useState(false);
  const urlRef = useRef<string | null>(null);

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
      const elapsed = Date.now() - started;
      if (elapsed > 6000) setColdStart(true);
      setProgress((p) => Math.min(p + (p < 60 ? 3 : 0.6), 95));
    }, 400);

    try {
      const runs: AnalyzeResponse[] = [];
      for (const file of files) {
        runs.push(await analyzeImage(file));
        setCompleted(runs.length);
      }
      setResult({
        filename: runs.map((r) => r.filename).join(" + "),
        total_detections: runs.reduce((t, r) => t + r.total_detections, 0),
        detections: runs.flatMap((r) => r.detections),
      });
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold uppercase tracking-[0.4em] text-primary">Sentinel</h1>
            <p className="label-tac">Underwater Intelligence System</p>
          </div>
          <div className="flex items-center gap-2 border border-border px-3 py-1.5">
            <span
              className={`inline-block h-2 w-2 ${status === "ANALYZING" ? "animate-pulse" : ""}`}
              style={{
                background:
                  status === "ERROR"
                    ? "var(--prio-high)"
                    : status === "ANALYZING"
                      ? "var(--prio-medium)"
                      : status === "COMPLETE"
                        ? "var(--prio-low)"
                        : "var(--muted-foreground)",
              }}
            />
            <span className={`text-[11px] uppercase tracking-[0.2em] ${STATUS_TONE[status]}`}>
              {status}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-4 px-5 py-5">
        {result && <AnalyticsBar result={result} />}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
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

            {result && (
              <section className="panel p-4">
                <h2 className="label-tac mb-3 text-primary">[ Export ]</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(toCSV(result), `sentinel-${result.filename}.csv`, "text/csv")
                    }
                    className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-border-bright hover:text-primary"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        JSON.stringify(result, null, 2),
                        `sentinel-${result.filename}.json`,
                        "application/json",
                      )
                    }
                    className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-border-bright hover:text-primary"
                  >
                    Export JSON
                  </button>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-4">
            <SonarViewer imageUrl={result ? imageUrl : null} detections={result?.detections ?? []} />
            {result && (
              <DetectionsPanel
                detections={result.detections}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-5 py-4 text-center">
        <p className="label-tac">Sentinel v1.0 — Classification: Restricted</p>
      </footer>
    </div>
  );
}
