import type { Doc, Id } from "@/convex/_generated/dataModel";

export type DatasetDoc = Doc<"datasets">;
export type ReportDoc = Doc<"reports">;
export type ChatMessageDoc = Doc<"chatMessages">;
export type ForecastDoc = Doc<"forecasts">;
export type DatasetId = Id<"datasets">;

export function fmtNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return fmtNumber(n);
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export const columnTypeColors: Record<string, string> = {
  number: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  date: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  category: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  text: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export const statusColors: Record<string, string> = {
  generating: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
};
