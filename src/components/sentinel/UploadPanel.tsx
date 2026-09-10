import { useRef, useState } from "react";
import { formatBytes } from "@/lib/sentinel";

interface Props {
  files: File[];
  onFiles: (files: File[]) => void;
  onRun: () => void;
  onRetry: () => void;
  loading: boolean;
  progress: number;
  completed: number;
  coldStart: boolean;
  error: string | null;
}

export function UploadPanel({
  files,
  onFiles,
  onRun,
  onRetry,
  loading,
  progress,
  completed,
  coldStart,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = (incoming: File[]) => {
    if (!incoming.length) return;
    if (incoming.some((f) => !["image/png", "image/jpeg"].includes(f.type))) {
      setLocalError("UNSUPPORTED FORMAT — PNG OR JPG SONAR FRAMES ONLY.");
      return;
    }
    setLocalError(null);
    onFiles(incoming);
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
          accept(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-10 text-center transition-colors ${
          drag
            ? "border-primary bg-primary/10"
            : "border-border hover:border-border-bright hover:bg-panel-raised/50"
        }`}
      >
        <div className="text-2xl text-primary">⌁</div>
        <p className="label-tac text-foreground">Drop sonar frames or click to browse</p>
        <p className="label-tac">PNG / JPG // MULTI-SELECT ENABLED</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => accept(Array.from(e.target.files ?? []))}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 max-h-32 space-y-px overflow-auto border border-border bg-panel-raised/30 p-1">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between px-2 py-1.5 text-xs">
              <span className="truncate text-foreground">{String(index + 1).padStart(2, "0")} // {file.name}</span>
              <span className="label-tac shrink-0 pl-3">{index < completed ? "DONE" : formatBytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={!files.length || loading}
        onClick={onRun}
        className="mt-3 w-full border border-primary/70 bg-primary/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
      >
        {loading ? `Analyzing ${completed + 1}/${files.length}` : `Run Batch // ${files.length || 0}`}
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
            ANALYZING SONAR FEED — THIS MAY TAKE UP TO A MINUTE
          </p>
        </div>
      )}

      {(error || localError) && (
        <div className="mt-3 border border-prio-high/60 bg-prio-high/10 p-3">
          <p className="text-[0.6875rem] uppercase leading-relaxed text-prio-high">{error ?? localError}</p>
          {error && <button type="button" onClick={onRetry} className="mt-2 text-[10px] font-bold uppercase text-prio-high underline">Retry failed batch</button>}
        </div>
      )}
    </section>
  );
}
