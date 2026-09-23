import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PRESET_INTENTS = [
  { value: "Sales performance overview", label: "Sales performance overview", hint: "Headline totals, trends, top segments" },
  { value: "Monthly summary", label: "Monthly summary", hint: "Month-by-month movement" },
  { value: "Operations snapshot", label: "Operations snapshot", hint: "Volumes, outliers, data quality" },
];

export default function NewReport() {
  const navigate = useNavigate();
  const { datasetId: datasetIdParam } = useParams<{ datasetId?: string }>();
  const datasets = useQuery(api.datasets.list);
  const generateReport = useAction(api.reportActions.generateReport);

  const [datasetId, setDatasetId] = useState<string>(datasetIdParam ?? "");
  const [intent, setIntent] = useState<string>(PRESET_INTENTS[0].value);
  const [customIntent, setCustomIntent] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Arriving from the library (no dataset in the URL) still defaults to the first one.
  const selectedDatasetId = datasetId || datasets?.[0]?._id || "";

  const handleGenerate = async () => {
    if (!selectedDatasetId) return;
    const finalIntent =
      intent === "custom" ? customIntent.trim() : intent;
    if (!finalIntent) {
      toast.error("Describe what the report should focus on.");
      return;
    }
    setGenerating(true);
    try {
      const reportId = await generateReport({
        datasetId: selectedDatasetId as Id<"datasets">,
        intent: finalIntent,
      });
      navigate(`/reports/${reportId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report generation failed");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <AppShell>
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-8" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Generating your report…</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              We're computing statistics from your data first, then a language model writes the narrative around those exact numbers. This usually takes 10–30 seconds.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Crunching numbers, writing narrative
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          eyebrow="Reports"
          title="New report"
          backTo="/reports"
          backLabel="Back to reports"
          description="Pick a dataset and what the report should focus on."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1 · Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            {datasets === undefined ? (
              <div className="h-9 animate-pulse rounded-md bg-muted" />
            ) : datasets.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No datasets yet — <Link to="/upload" className="text-primary hover:underline">upload one first</Link>.
              </div>
            ) : (
              <Select value={selectedDatasetId} onValueChange={setDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name} · {d.rowCount.toLocaleString()} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 · Report focus</CardTitle>
            <CardDescription>We compute the stats; the AI writes the story around them. It never invents numbers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {PRESET_INTENTS.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    intent === p.value ? "border-primary bg-accent/40" : "hover:bg-accent/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={p.value}
                    checked={intent === p.value}
                    onChange={() => setIntent(p.value)}
                    className="accent-[var(--primary)]"
                  />
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.hint}</p>
                  </div>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  intent === "custom" ? "border-primary bg-accent/40" : "hover:bg-accent/20"
                }`}
              >
                <input
                  type="radio"
                  name="intent"
                  value="custom"
                  checked={intent === "custom"}
                  onChange={() => setIntent("custom")}
                  className="accent-[var(--primary)]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Custom prompt</p>
                  {intent === "custom" && (
                    <Textarea
                      value={customIntent}
                      onChange={(e) => setCustomIntent(e.target.value)}
                      placeholder="e.g. Focus on why Q3 revenue dipped and which region recovered fastest"
                      className="mt-2 min-h-[72px]"
                      autoFocus
                    />
                  )}
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={!selectedDatasetId || generating} className="gap-2">
            <Sparkles className="size-4" />
            Generate report
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
