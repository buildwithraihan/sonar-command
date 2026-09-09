import { useEffect, useRef, useState } from "react";
import type { Detection } from "@/lib/sentinel";

const COLOR: Record<string, string> = {
  HIGH: "var(--prio-high)",
  MEDIUM: "var(--prio-medium)",
  LOW: "var(--prio-low)",
};

export function SonarViewer({
  imageUrl,
  detections,
}: {
  imageUrl: string | null;
  detections: Detection[];
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0, natW: 0, natH: 0 });

  useEffect(() => {
    const measure = () => {
      const el = imgRef.current;
      if (!el) return;
      setBox({
        w: el.clientWidth,
        h: el.clientHeight,
        natW: el.naturalWidth,
        natH: el.naturalHeight,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [imageUrl, detections]);

  const sx = box.natW ? box.w / box.natW : 0;
  const sy = box.natH ? box.h / box.natH : 0;

  return (
    <section className="panel scanline sonar-grid flex min-h-[440px] flex-col overflow-hidden p-4">
      <h2 className="label-tac mb-3 text-primary">[ Sonar Viewer ]</h2>
      {!imageUrl ? (
        <div className="relative flex flex-1 items-center justify-center border border-dashed border-border">
          <div className="crosshair" aria-hidden="true" />
          <p className="label-tac z-10 text-primary">Awaiting Sonar Feed Input</p>
        </div>
      ) : (
        <div className="relative inline-block self-center">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Uploaded sonar frame under analysis"
            onLoad={(e) =>
              setBox({
                w: e.currentTarget.clientWidth,
                h: e.currentTarget.clientHeight,
                natW: e.currentTarget.naturalWidth,
                natH: e.currentTarget.naturalHeight,
              })
            }
            className="max-h-[70vh] w-auto max-w-full border border-border-bright"
          />
          {sx > 0 &&
            detections.map((d, i) => {
              const color = COLOR[d.priority] ?? COLOR["LOW"];
              return (
                <div
                  key={i}
                  className="pointer-events-none absolute"
                  style={{
                    left: d.bbox.x1 * sx,
                    top: d.bbox.y1 * sy,
                    width: (d.bbox.x2 - d.bbox.x1) * sx,
                    height: (d.bbox.y2 - d.bbox.y1) * sy,
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 12px -2px ${color}`,
                  }}
                >
                  <span
                    className="absolute -top-[18px] left-0 whitespace-nowrap px-1 text-[10px] uppercase tracking-widest"
                    style={{ background: color, color: "var(--background)" }}
                  >
                    {d.class} {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
