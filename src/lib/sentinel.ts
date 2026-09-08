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

const API_URL = import.meta.env["VITE_API_URL"] ?? "https://sentinel-2h7a.onrender.com";

export async function analyzeImage(file: File, timeoutMs = 45000): Promise<AnalyzeResponse> {
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
        "REQUEST TIMED OUT AFTER 45s — ANALYSIS NODE UNREACHABLE OR STILL COLD. RETRY TRANSMISSION.",
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
