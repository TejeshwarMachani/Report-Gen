import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useParams, Link } from "react-router";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
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
import { ForecastChart } from "@/components/ChartFrame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columnTypeColors, fmtBytes, fmtNumber } from "@/lib/report";
import {
  CalendarClock,
  MessageSquareText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function DatasetDetail() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const dataset = useQuery(
    api.datasets.get,
    datasetId ? { datasetId: datasetId as Id<"datasets"> } : "skip",
  );
  const forecasts = useQuery(
    api.forecasts.listForDataset,
    datasetId ? { datasetId: datasetId as Id<"datasets"> } : "skip",
  );
  const runForecast = useAction(api.forecastActions.runForecast);

  const numericCols = dataset?.columns.filter((c) => c.type === "number") ?? [];
  const dateCols = dataset?.columns.filter((c) => c.type === "date") ?? [];

  const [metricCol, setMetricCol] = useState<string>("");
  const [dateCol, setDateCol] = useState<string>("");
  const [horizon, setHorizon] = useState<string>("6");
  const [running, setRunning] = useState(false);

  // Default to the first usable columns so forecasting is one click away,
  // while still letting the user override the choice.
  const selectedMetric = metricCol || numericCols[0]?.name || "";
  const selectedDate = dateCol || dateCols[0]?.name || "";

  const selectedForecast = forecasts?.[0];

  const handleRunForecast = async () => {
    if (!datasetId || !selectedMetric || !selectedDate) return;
    setRunning(true);
    try {
      await runForecast({
        datasetId: datasetId as Id<"datasets">,
        metricColumn: selectedMetric,
        dateColumn: selectedDate,
        horizon: parseInt(horizon, 10),
      });
      toast.success("Forecast ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Forecast failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {dataset === undefined ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        ) : dataset === null ? (
          <PageHeader
            eyebrow="Dataset"
            title="Dataset not found"
            backTo="/dashboard"
            backLabel="Back to dashboard"
            description="This dataset may have been deleted, or it belongs to another workspace."
          />
        ) : (
          <PageHeader
            eyebrow="Dataset"
            title={dataset.name}
            backTo="/dashboard"
            backLabel="Back to dashboard"
            description={
              <span className="tabular-nums">
                {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns · {fmtBytes(dataset.fileSize)} · {dataset.fileName}
              </span>
            }
            actions={
              <>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/datasets/${datasetId}/report`}>
                    <Sparkles className="size-3.5" /> New report
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to={`/datasets/${datasetId}/chat`}>
                    <MessageSquareText className="size-3.5" /> Chat with data
                  </Link>
                </Button>
              </>
            }
          />
        )}

        {dataset && (
          <>
            {/* Columns */}
            <section>
              <div className="mb-3">
                <h2 className="font-display text-lg font-semibold">Columns</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Detected types and data quality — this is what the analysis runs on.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dataset.columns.map((c) => (
                  <Card key={c.name} className="card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                        <Badge variant="secondary" className={`capitalize ${columnTypeColors[c.type]}`}>
                          {c.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs tabular-nums text-muted-foreground">
                      <p>{fmtNumber(c.uniqueCount)} unique · {c.missingCount} missing</p>
                      <p className="mt-1 truncate">{c.sample.join(", ") || "—"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Forecast */}
            <section>
              <h2 className="font-display mb-3 text-lg font-semibold">Forecast a metric</h2>
              <Card>
                <CardHeader>
                  <CardDescription>
                    Pick a number and a date column. We project the monthly total forward with a linear trend and a confidence band — computed from your data, no black box.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {numericCols.length === 0 || dateCols.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Forecasting needs at least one number column and one date column. This dataset doesn't have both.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Metric</span>
                          <Select value={selectedMetric} onValueChange={setMetricCol}>
                            <SelectTrigger className="h-9 w-[180px]">
                              <SelectValue placeholder="Number column" />
                            </SelectTrigger>
                            <SelectContent>
                              {numericCols.map((c) => (
                                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Date column</span>
                          <Select value={selectedDate} onValueChange={setDateCol}>
                            <SelectTrigger className="h-9 w-[180px]">
                              <SelectValue placeholder="Date column" />
                            </SelectTrigger>
                            <SelectContent>
                              {dateCols.map((c) => (
                                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Horizon</span>
                          <Select value={horizon} onValueChange={setHorizon}>
                            <SelectTrigger className="h-9 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[3, 6, 12].map((h) => (
                                <SelectItem key={h} value={String(h)}>{h} months</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleRunForecast} disabled={running || !selectedMetric || !selectedDate} className="gap-2">
                          {running ? <CalendarClock className="size-4 animate-pulse" /> : <TrendingUp className="size-4" />}
                          {running ? "Computing…" : "Run forecast"}
                        </Button>
                      </div>

                      {selectedForecast && (
                        <div className="mt-6">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                              {selectedForecast.metricColumn} · next {selectedForecast.horizon} months
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              dashed = forecast
                            </span>
                          </div>
                          <ForecastChart data={selectedForecast.points} />
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {selectedForecast.summary}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
