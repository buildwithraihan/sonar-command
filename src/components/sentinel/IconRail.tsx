import { BarChart3, Download, History, Settings, Upload } from "lucide-react";

const items = [
  { label: "Upload", icon: Upload, target: "upload" },
  { label: "History", icon: History, target: "history" },
  { label: "Analytics", icon: BarChart3, target: "analytics" },
  { label: "Export", icon: Download, target: "export" },
  { label: "Settings", icon: Settings, target: "settings" },
];

export function IconRail() {
  const jump = (target: string) => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-14 shrink-0 border-r border-border bg-panel/80 py-2 md:flex md:flex-col md:items-center">
    <div className="mb-4 h-6 w-6 border border-primary/60 p-1"><div className="h-full w-full bg-primary/25" /></div>
    <nav className="flex flex-col gap-1" aria-label="Dashboard sections">
      {items.map(({ label, icon: Icon, target }, index) => <button key={label} type="button" title={label} aria-label={label} onClick={() => jump(target)} className={`rail-button ${index === 0 ? "rail-button-active" : ""}`}><Icon className="h-4 w-4" /></button>)}
    </nav>
  </aside>;
}