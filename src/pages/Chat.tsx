import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SeriesBarChart, SeriesLineChart, SeriesPieChart } from "@/components/ChartFrame";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Loader2,
  MessageSquareText,
  Send,
} from "lucide-react";

const chartMap = { bar: SeriesBarChart, line: SeriesLineChart, pie: SeriesPieChart };

export default function Chat() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const dataset = useQuery(api.datasets.get, datasetId ? { datasetId: datasetId as Id<"datasets"> } : "skip");
  const messages = useQuery(api.chat.listMessages, datasetId ? { datasetId: datasetId as Id<"datasets"> } : "skip");
  const sendQuestion = useMutation(api.chat.sendQuestion);
  const answerQuestion = useAction(api.chatActions.answerQuestion);

  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [openQuery, setOpenQuery] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mirrors `waiting` for the synchronous double-submit guard inside `ask`.
  const waitingRef = useRef(false);
  useEffect(() => {
    waitingRef.current = waiting;
  }, [waiting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, waiting]);

  const ask = async (question: string) => {
    if (!datasetId || !question.trim() || waitingRef.current) return;
    setInput("");
    setWaiting(true);
    try {
      const { computation } = await sendQuestion({
        datasetId: datasetId as Id<"datasets">,
        question,
      });
      // Optimistic scroll: messages query will pick up the user message.
      await answerQuestion({
        datasetId: datasetId as Id<"datasets">,
        computation,
        history: [
          ...(messages ?? [])
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: question },
        ],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not answer the question");
    } finally {
      setWaiting(false);
    }
  };

  return (
    <AppShell>
      {/* dvh keeps the composer above mobile browser chrome; vh is the fallback. */}
      <div className="mx-auto flex h-[calc(100vh-10.5rem)] w-full max-w-3xl flex-col supports-[height:100dvh]:h-[calc(100dvh-10.5rem)]">
        {/* Header */}
        <div className="mb-4 shrink-0">
          <Link
            to={dataset ? `/datasets/${dataset._id}` : "/dashboard"}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to dataset
          </Link>
          <p className="eyebrow">Chat with data</p>
          <div className="mt-1.5 flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary" />
            <h1 className="font-display text-xl font-bold tracking-tight">
              {dataset ? dataset.name : "Chat"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask plain-English questions. Every answer shows the exact computation behind it.
          </p>
        </div>

        {/* Messages */}
        <div className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
          {messages === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-2/3 rounded-2xl" />
              <Skeleton className="ml-auto h-16 w-1/2 rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquareText className="size-6" />
              </div>
              <div>
                <p className="font-medium">Ask your first question</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Try "What is the total of {dataset?.columns.find((c) => c.type === "number")?.name ?? "…"}?"
                  or "{dataset?.columns.find((c) => c.type === "category")?.name ?? "category"} breakdown".
                </p>
              </div>
              {dataset && (
                <div className="flex flex-wrap justify-center gap-2">
                  {dataset.columns.filter((c) => c.type === "number").slice(0, 2).map((c) => (
                    <Button
                      key={c.name}
                      variant="secondary"
                      size="sm"
                      onClick={() => ask(`What is the total ${c.name}?`)}
                    >
                      Total {c.name}
                    </Button>
                  ))}
                  {dataset.columns.filter((c) => c.type === "category").slice(0, 1).map((c) => {
                    const metric = dataset.columns.find((n) => n.type === "number");
                    if (!metric) return null;
                    return (
                      <Button
                        key={c.name}
                        variant="secondary"
                        size="sm"
                        onClick={() => ask(`${metric.name} by ${c.name}`)}
                      >
                        {metric.name} by {c.name}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m._id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m._id} className="flex flex-col gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-4 py-3 text-sm leading-6">
                    {m.content}
                  </div>
                  {m.chart && (
                    <Card className="max-w-[85%] py-3">
                      <CardContent className="px-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{m.chart.title}</p>
                        {(() => {
                          const Chart = chartMap[m.chart.chartType] ?? SeriesBarChart;
                          return <Chart data={m.chart.data} />;
                        })()}
                      </CardContent>
                    </Card>
                  )}
                  {m.query && (
                    <div className="max-w-[85%]">
                      <button
                        onClick={() => setOpenQuery((s) => ({ ...s, [m._id]: !s[m._id] }))}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Code2 className="size-3.5" />
                        Here's the computation I ran
                        <ChevronDown className={`size-3 transition-transform ${openQuery[m._id] ? "rotate-180" : ""}`} />
                      </button>
                      {openQuery[m._id] && (
                        <pre className="thin-scroll mt-1.5 overflow-x-auto rounded-lg border bg-muted/50 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
{`${m.query.kind.toUpperCase()}\n${m.query.description}\n\nResult:\n${JSON.stringify(m.query.result, null, 2).slice(0, 800)}`}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ),
            )
          )}
          {waiting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Computing from your data…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex shrink-0 gap-2 border-t pt-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder='Ask about this dataset — e.g. "total revenue by region"'
            disabled={waiting}
          />
          <Button onClick={() => ask(input)} disabled={waiting || !input.trim()} size="icon" className="shrink-0">
            {waiting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
