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
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  FileBarChart,
  MessageSquareText,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const datasets = useQuery(api.datasets.list);
  const reports = useQuery(api.reports.list);
  const org = useQuery(api.orgs.getOrCreate);

  const loading = datasets === undefined || reports === undefined;
  const readyReports = reports?.filter((r) => r.status === "ready") ?? [];
  const latest = readyReports[0];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{org?.name ?? "Workspace"}</p>
            <h1 className="font-display mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
          </div>
          <Button asChild className="gap-2 self-start sm:self-auto">
            <Link to="/upload">
              <Plus className="size-4" />
              New dataset
            </Link>
          </Button>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="card-hover">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <UploadCloud className="size-3.5" /> Datasets
                  </CardDescription>
                  <CardTitle className="tabular-nums text-3xl">{datasets!.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to="/upload" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Upload another
                  </Link>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <FileBarChart className="size-3.5" /> Reports ready
                  </CardDescription>
                  <CardTitle className="tabular-nums text-3xl">{readyReports.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    View library
                  </Link>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Latest report
                  </CardDescription>
                  <CardTitle className="line-clamp-1 text-base font-semibold leading-6">
                    {latest ? latest.title : "None yet"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latest ? (
                    <Link to={`/reports/${latest._id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Open report <ArrowRight className="size-3.5" />
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Generate your first report</span>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Empty state */}
            {datasets!.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UploadCloud className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Upload your first dataset</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Drop in a CSV or Excel export — sales, inventory, marketing. We detect column types automatically and generate a readable report in minutes.
                    </p>
                  </div>
                  <Button asChild className="mt-1 gap-2">
                    <Link to="/upload">
                      <UploadCloud className="size-4" /> Upload data
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Datasets */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">Datasets</h2>
                    <Link to="/upload" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Plus className="size-3.5" /> Add
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {datasets!.map((ds) => (
                      <Card key={ds._id} className="card-hover flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{ds.name}</CardTitle>
                            <Badge variant="secondary" className="tabular-nums font-normal">
                              {ds.rowCount.toLocaleString()} rows
                            </Badge>
                          </div>
                          <CardDescription className="tabular-nums">
                            {ds.columns.length} columns · {ds.fileName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex flex-wrap gap-2 border-t pt-4">
                          <Button asChild size="sm" variant="secondary" className="gap-1.5">
                            <Link to={`/datasets/${ds._id}/report`}>
                              <Sparkles className="size-3.5" /> New report
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <Link to={`/datasets/${ds._id}`}>
                              <BarChart3 className="size-3.5" /> Explore
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="gap-1.5">
                            <Link to={`/datasets/${ds._id}/chat`}>
                              <MessageSquareText className="size-3.5" /> Chat
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Recent reports */}
                {readyReports.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold">Recent reports</h2>
                      <Link to="/reports" className="text-sm text-primary hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                      {readyReports.slice(0, 4).map((r) => (
                        <Link
                          key={r._id}
                          to={`/reports/${r._id}`}
                          className="group flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
