import type { Id } from "@/convex/_generated/dataModel";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  SeriesBarChart,
  SeriesLineChart,
  SeriesPieChart,
} from "@/components/ChartFrame";
import { fmtDateTime } from "@/lib/report";
import { exportDocx, exportPdf } from "@/lib/export";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const chartIcons = { bar: SeriesBarChart, line: SeriesLineChart, pie: SeriesPieChart };

export default function ReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const report = useQuery(api.reports.get, reportId ? { reportId: reportId as Id<"reports"> } : "skip");
  const rate = useMutation(api.reports.rate);
  const removeReport = useMutation(api.reports.remove);

  if (report === undefined) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (report === null) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl py-16 text-center">
          <p className="text-sm text-muted-foreground">Report not found.</p>
        </div>
      </AppShell>
    );
  }

  const handleRate = async (rating: "up" | "down") => {
    try {
      await rate({ reportId: report._id, rating });
      toast.success(rating === "up" ? "Thanks for the feedback!" : "Sorry to hear that — noted.");
    } catch {
      toast.error("Could not save rating");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await removeReport({ reportId: report._id });
      toast.success("Report deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const narrative = report.narrative;
  const failed = report.status === "failed";
  const generating = report.status === "generating";

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="no-print">
          <Link to="/reports" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All reports
          </Link>
        </div>

        {generating && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="font-medium">Generating report…</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Computing stats from your data, then writing the narrative. This page will update automatically when it's ready.
              </p>
            </CardContent>
          </Card>
        )}

        {failed && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-start gap-2 py-8">
              <p className="font-medium text-destructive">Report generation failed</p>
              <p className="text-sm text-muted-foreground">{report.error ?? "Unknown error."}</p>
              <Button asChild size="sm" variant="outline" className="mt-2 gap-1.5">
                <Link to={`/datasets/${report.datasetId}/report`}>Try again</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {report.status === "ready" && (
          <article className="flex flex-col gap-6">
            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">Generated report</p>
                <h1 className="font-display mt-1.5 text-2xl font-bold tracking-tight">{report.title}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {report.status}
                  </Badge>
                  {fmtDateTime(report.createdAt)}
                </p>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPdf(report)}>
                  <FileText className="size-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportDocx(report)}>
                  <Download className="size-3.5" /> Word
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Headline metrics */}
            {report.headlineMetrics && report.headlineMetrics.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {report.headlineMetrics.map((m, i) => (
                  <Card key={i} className="print-block">
                    <CardContent>
                      <p className="eyebrow">{m.label}</p>
                      <p className="font-display tabular-nums mt-2 text-2xl font-bold">{m.value}</p>
                      {m.change && (
                        <p
                          className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
                            m.direction === "up"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : m.direction === "down"
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {m.direction === "up" && <TrendingUp className="size-3.5" />}
                          {m.direction === "down" && <TrendingDown className="size-3.5" />}
                          {m.change} first-to-last month
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Narrative */}
            {narrative && (
              <Card className="print-block">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Summary</CardTitle>
                  <CardDescription>{narrative.headline}</CardDescription>
                </CardHeader>
                <CardContent className="prose-report">
                  <p className="text-[15px] leading-7 text-foreground/90">{narrative.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {report.insights && report.insights.length > 0 && (
              <Card className="print-block">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" /> Key insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {report.insights.map((ins, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[15px] leading-7 text-foreground/90">
                        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {ins}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            {report.charts && report.charts.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-semibold">Charts</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {report.charts.map((c, i) => {
                    const Chart = chartIcons[c.chartType] ?? SeriesBarChart;
                    return (
                      <Card key={i} className="print-block md:col-span-1">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-sm font-semibold">{c.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Chart data={c.data} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Watch */}
            {narrative?.watch && (
              <Card className="print-block border-primary/30 bg-accent/30">
                <CardHeader>
                  <CardTitle className="font-display text-lg">What to watch</CardTitle>
                </CardHeader>
                <CardContent className="prose-report">
                  <p className="text-[15px] leading-7 text-foreground/90">{narrative.watch}</p>
                </CardContent>
              </Card>
            )}

            {/* Rating + footer */}
            <Separator />
            <div className="no-print flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Was this report helpful?</span>
                <Button
                  variant={report.rating === "up" ? "secondary" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleRate("up")}
                >
                  <ArrowUp className="size-3.5" /> Yes
                </Button>
                <Button
                  variant={report.rating === "down" ? "secondary" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleRate("down")}
                >
                  <ArrowDown className="size-3.5" /> Not really
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                All figures computed deterministically from your dataset; the narrative was AI-written around those numbers.
              </p>
            </div>
          </article>
        )}
      </div>
    </AppShell>
  );
}
