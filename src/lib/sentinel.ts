export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface Detection {
  class: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  category: string;
  detection_quality: string;
  priority: Priority | string;
}

export interface AnalyzeResponse {
  filename: string;
  total_detections: number;
  detections: Detection[];
}

export interface SessionRun {
  id: string;
  timestamp: string;
  filename: string;
  responseMs: number;
  highestPriority: Priority | "NONE";
  result: AnalyzeResponse;
}

const API_URL = import.meta.env["VITE_API_URL"] ?? "https://sentinel-2h7a.onrender.com";

export async function analyzeImage(file: File, timeoutMs = 120000): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body = new FormData();
  body.append("file", file);

  try {
    const res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`ANALYSIS FAILED — SERVER RESPONDED ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as AnalyzeResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "REQUEST TIMED OUT AFTER 120s — ANALYSIS NODE UNREACHABLE OR STILL COLD. RETRY TRANSMISSION.",
      );
    }
    if (err instanceof TypeError) {
      throw new Error("NETWORK LINK FAILURE — UNABLE TO REACH ANALYSIS NODE.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function toCSV(data: AnalyzeResponse): string {
  const head = [
    "filename",
    "class",
    "confidence",
    "category",
    "detection_quality",
    "priority",
    "x1",
    "y1",
    "x2",
    "y2",
  ];
  const rows = data.detections.map((d) =>
    [
      data.filename,
      d.class,
      d.confidence,
      d.category,
      d.detection_quality,
      d.priority,
      d.bbox.x1,
      d.bbox.y1,
      d.bbox.x2,
      d.bbox.y2,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function combineResults(runs: SessionRun[]): AnalyzeResponse {
  return {
    filename: runs.map((r) => r.filename).join(" + "),
    total_detections: runs.reduce((total, run) => total + run.result.total_detections, 0),
    detections: runs.flatMap((run) => run.result.detections),
  };
}

export function highestPriority(detections: Detection[]): Priority | "NONE" {
  if (detections.some((d) => d.priority === "HIGH")) return "HIGH";
  if (detections.some((d) => d.priority === "MEDIUM")) return "MEDIUM";
  if (detections.some((d) => d.priority === "LOW")) return "LOW";
  return "NONE";
}

export async function exportSessionPDF(runs: SessionRun[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const total = runs.reduce((sum, run) => sum + run.result.total_detections, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SENTINEL // SESSION REPORT", 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  doc.text(`Images analyzed: ${runs.length}   Total detections: ${total}`, 14, 32);
  let y = 43;
  for (const run of runs) {
    if (y > 260) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold");
    doc.text(`${run.filename} // ${new Date(run.timestamp).toLocaleString()} // ${run.responseMs} ms`, 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    if (!run.result.detections.length) { doc.text("No detections", 18, y); y += 7; continue; }
    for (const d of run.result.detections) {
      if (y > 280) { doc.addPage(); y = 18; }
      doc.text(`${d.class} | ${(d.confidence * 100).toFixed(1)}% | ${d.priority} | ${d.category} | ${d.detection_quality}`, 18, y);
      y += 6;
    }
    y += 4;
  }
  doc.save(`sentinel-session-${Date.now()}.pdf`);
}
