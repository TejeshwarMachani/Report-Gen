import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseDataFile,
  MAX_FILE_LABEL,
  ROW_CAP,
  type ColumnType,
  type ParsedData,
} from "@/lib/parse";

const TYPE_OPTIONS: { value: ColumnType; label: string; hint: string }[] = [
  { value: "number", label: "Number", hint: "sums, averages, trends" },
  { value: "date", label: "Date", hint: "timelines, forecasting" },
  { value: "category", label: "Category", hint: "group-bys, breakdowns" },
  { value: "text", label: "Text", hint: "ignored in analysis" },
];

export default function Upload() {
  const navigate = useNavigate();
  const createDataset = useMutation(api.datasets.create);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setWarning(null);
    const result = await parseDataFile(file);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      setParsed(null);
      return;
    }
    setParsed(result.data!);
    setWarning(result.warning ?? null);
    setDatasetName(file.name.replace(/\.(csv|xlsx|xls|txt)$/i, ""));
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const id = await createDataset({
        name: datasetName || parsed.fileName,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        rowCount: parsed.rows.length,
        columns: parsed.columns.map((c) => ({ ...c, type: c.type })),
        rows: parsed.rows as never,
      });
      toast.success("Dataset saved");
      navigate(`/datasets/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save dataset");
      setSaving(false);
    }
  };

  const setType = (idx: number, type: ColumnType) => {
    setParsed((p) => {
      if (!p) return p;
      const columns = [...p.columns];
      columns[idx] = { ...columns[idx], type };
      return { ...p, columns };
    });
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">Upload data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV or Excel, up to {MAX_FILE_LABEL}. Column types are detected automatically — adjust anything that looks wrong.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            <a
              href="/sample-data.csv"
              download
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <Download className="size-4" />
              Download a sample dataset to try it out
            </a>
          </p>
        </div>

        {!parsed && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-card px-6 py-16 text-center transition-colors ${
              dragging ? "border-primary bg-accent/50" : "hover:border-primary/50 hover:bg-accent/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {busy ? (
              <>
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Parsing file…</p>
              </>
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="size-7" />
                </div>
                <div>
                  <p className="font-medium">Drag &amp; drop your file here</p>
                  <p className="mt-1 text-sm text-muted-foreground">or click to browse · CSV, XLSX · max {MAX_FILE_LABEL}</p>
                </div>
              </>
            )}
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {parsed && (
          <>
            {warning && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>{warning}</span>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{parsed.fileName}</CardTitle>
                      <CardDescription className="tabular-nums">
                        {parsed.rows.length.toLocaleString()} rows · {parsed.columns.length} columns
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setParsed(null); setError(null); setWarning(null); }}>
                    Choose a different file
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dataset name</CardTitle>
                <CardDescription>How this dataset will appear in your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <Input value={datasetName} onChange={(e) => setDatasetName(e.target.value)} placeholder="e.g. Q3 Sales" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected columns</CardTitle>
                <CardDescription>
                  Confirm column types so the analysis is accurate. Numbers power metrics and forecasts, dates power timelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-2 font-medium">Column</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Sample values</th>
                        <th className="px-6 py-2 text-right font-medium">Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.columns.map((col, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-6 py-3 font-medium">{col.name}</td>
                          <td className="px-4 py-3">
                            <Select value={col.type} onValueChange={(v) => setType(idx, v as ColumnType)}>
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TYPE_OPTIONS.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                    <span className="ml-2 text-xs text-muted-foreground">{t.hint}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                            {col.sample.join(", ") || "—"}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">
                            {col.missingCount > 0 ? `${col.missingCount} cells` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Rows beyond {ROW_CAP.toLocaleString()} are sampled for analysis.
              </p>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Save dataset
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
