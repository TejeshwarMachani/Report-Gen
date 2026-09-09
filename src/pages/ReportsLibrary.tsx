import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";
import { fmtDateTime, statusColors } from "@/lib/report";
import { ArrowRight, FileBarChart, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportsLibrary() {
  const reports = useQuery(api.reports.list);
  const datasets = useQuery(api.datasets.list);
  const removeReport = useMutation(api.reports.remove);
  const [search, setSearch] = useState("");

  const datasetName = (id: string) =>
    datasets?.find((d) => d._id === id)?.name ?? "Deleted dataset";

  const filtered = useMemo(() => {
    if (!reports) return [];
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.intent.toLowerCase().includes(q) ||
        datasetName(r.datasetId).toLowerCase().includes(q),
    );
  }, [reports, datasets, search]);

  const handleDelete = async (id: Id<"reports">) => {
    if (!confirm("Delete this report?")) return;
    try {
      await removeReport({ reportId: id });
      toast.success("Report deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every generated report, saved and searchable.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/reports/new">
              <FileBarChart className="size-4" /> New report
              </Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, intent, or dataset…"
            className="pl-9"
          />
        </div>

        {reports === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
            <FileBarChart className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{search ? "No reports match your search" : "No reports yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Try a different search term." : "Generate your first report from a dataset."}
              </p>
            </div>
            {!search && (
              <Button asChild size="sm" className="mt-1">
                <Link to="/reports/new">Create a report</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((r) => (
              <div
                key={r._id}
                className="group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <Link to={`/reports/${r._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileBarChart className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {datasetName(r.datasetId)} · {fmtDateTime(r.createdAt)}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className={`capitalize ${statusColors[r.status]}`}>
                    {r.status}
                  </Badge>
                  <Link
                    to={`/reports/${r._id}`}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Open report"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete report"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
