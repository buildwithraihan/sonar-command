import { useRef, useState } from "react";
import { formatBytes } from "@/lib/sentinel";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  onRun: () => void;
  loading: boolean;
  progress: number;
  coldStart: boolean;
  error: string | null;
}

export function UploadPanel({
  file,
  onFile,
  onRun,
  loading,
  progress,
  coldStart,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setLocalError("UNSUPPORTED FORMAT — PNG OR JPG SONAR FRAMES ONLY.");
      return;
    }
    setLocalError(null);
    onFile(f);
  };

  return (
    <section className="panel p-4">
      <h2 className="label-tac mb-3 text-primary">[ Sonar Feed Input ]</h2>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-10 text-center transition-colors ${
          drag
            ? "border-primary bg-primary/10"
            : "border-border hover:border-border-bright hover:bg-panel-raised/50"
        }`}
      >
        <div className="text-2xl text-primary">⌁</div>
        <p className="label-tac text-foreground">Drop sonar frame or click to browse</p>
        <p className="label-tac">PNG / JPG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="mt-3 flex items-center justify-between border border-border bg-panel-raised/60 px-3 py-2">
          <span className="truncate text-xs tracking-wider text-foreground">{file.name}</span>
          <span className="label-tac shrink-0 pl-3">{formatBytes(file.size)}</span>
        </div>
      )}

      <button
        type="button"
        disabled={!file || loading}
        onClick={onRun}
        className="mt-3 w-full border border-primary/70 bg-primary/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
      >
        {loading ? "Analyzing…" : "Run Analysis"}
      </button>

      {loading && (
        <div className="mt-3">
          <div className="h-1 w-full bg-panel-raised">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="label-tac mt-2 animate-pulse text-primary">
            {coldStart
              ? "Waking up analysis node — free-tier cold start, up to 60s…"
              : "Transmitting frame to analysis node…"}
          </p>
        </div>
      )}

      {(error || localError) && (
        <p className="mt-3 border border-prio-high/60 bg-prio-high/10 px-3 py-2 text-[0.6875rem] uppercase leading-relaxed tracking-wider text-prio-high">
          {error ?? localError}
        </p>
      )}
    </section>
  );
}
