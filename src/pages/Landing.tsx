import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import logo from "@/assets/logo.svg";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const dashboardCta = isAuthenticated ? "/dashboard" : "/auth";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-background"
    >
      {/* Announcement bar */}
      <div className="border-b bg-foreground text-background">
        <div className="mx-auto flex h-9 w-full max-w-6xl items-center justify-center gap-2 px-4 text-xs font-medium">
          <Sparkles className="size-3.5" />
          <span>ReportGen turns a raw CSV into a board-ready report in about a minute.</span>
          <Link to={dashboardCta} className="hidden items-center gap-0.5 underline underline-offset-4 hover:opacity-80 sm:inline-flex">
            Try it free <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ReportGen" className="size-8 rounded-lg" />
            <span className="font-display text-base font-bold tracking-tight">ReportGen</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Product</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Accuracy</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>Sign in</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to={dashboardCta}>
                Start free <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — structured, left-aligned, product mock beside the copy */}
      <section className="hero-backdrop border-b">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-24">
          <div>
            <motion.p
              {...fadeUp}
              className="eyebrow flex items-center gap-2"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              AI business reporting
            </motion.p>
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="font-display mt-4 text-4xl font-bold leading-[1.06] tracking-tight sm:text-[3.4rem]"
            >
              Business reports from your own data —{" "}
              <span className="text-primary">in plain English</span>
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
            >
              Upload a CSV or Excel export. ReportGen computes the real numbers first, then writes the narrative, charts, and forecasts around them — ready to read in five minutes and share as PDF or Word.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="h-11 gap-2 px-6 text-[15px]">
                <Link to={dashboardCta}>
                  Upload your data <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-[15px]">
                <a href="#how">See how it works</a>
              </Button>
            </motion.div>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              Free to start · No credit card · Your data stays in your workspace
            </motion.p>
          </div>

          {/* Product mock — modeled on the actual report view */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="lg:-mr-8">
            <div className="overflow-hidden rounded-xl border bg-card shadow-xl shadow-foreground/[0.06]">
              {/* Mock window chrome */}
              <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2.5">
                <span className="size-2.5 rounded-full border border-border bg-background" />
                <span className="size-2.5 rounded-full border border-border bg-background" />
                <span className="size-2.5 rounded-full border border-border bg-background" />
                <span className="ml-3 rounded-md border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                  reportgen.app/reports/monthly-sales
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="eyebrow">Monthly business report</p>
                    <p className="font-display mt-1 text-lg font-bold">Sales Performance — March</p>
                  </div>
                  <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    Generated in 24s
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Total revenue", value: "$182,400", change: "+12.4%", up: true },
                    { label: "Orders", value: "1,208", change: "+6.1%", up: true },
                    { label: "Avg. order value", value: "$151", change: "-2.3%", up: false },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg border bg-background px-3.5 py-3">
                      <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
                      <p className="font-display tabular-nums mt-1 text-lg font-bold">{m.value}</p>
                      <p className={`mt-0.5 text-xs font-medium tabular-nums ${m.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {m.change} vs last month
                      </p>
                    </div>
                  ))}
                </div>
                {/* Mock chart */}
                <div className="mt-3 rounded-lg border bg-background p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Revenue by month</p>
                    <p className="text-[10px] text-muted-foreground">Actual vs trend</p>
                  </div>
                  <div className="mt-3 flex h-24 items-end gap-1.5">
                    {[38, 46, 42, 55, 61, 58, 67, 72, 70, 78, 84, 88].map((h, i) => (
                      <div key={i} className="group relative flex-1">
                        <div
                          className={`w-full rounded-sm transition-opacity group-hover:opacity-80 ${i >= 10 ? "bg-primary/40" : "bg-primary"}`}
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-lg border bg-accent/50 px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
                    <Sparkles className="size-3" /> Key insight
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground/90">
                    Revenue grew 12.4%, driven mostly by the Online segment (48% of sales). Watch average order value — it slipped 2.3% even as volume rose.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">Product</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you'd ask a data analyst — minus the analyst
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Reports, answers, and forecasts on the data you already have. No BI setup, no pivot tables, no waiting on IT.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Instant business reports",
                desc: "Upload a file, pick a focus, get a narrative report with headline metrics and charts. Export to PDF or Word.",
              },
              {
                icon: MessageSquareText,
                title: "Chat with your data",
                desc: "Ask questions in plain English. Every answer shows the exact computation it ran — nothing hidden.",
              },
              {
                icon: TrendingUp,
                title: "Forecasting",
                desc: "Pick a metric and a date column, project 3–12 periods ahead with a confidence band in plain language.",
              },
              {
                icon: ShieldCheck,
                title: "Accurate by construction",
                desc: "Statistics are computed deterministically from your rows. The AI writes the story — it never invents numbers.",
              },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }}>
                <Card className="card-hover h-full">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="font-display text-base font-semibold">{f.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-muted/40 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From raw export to readable report
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Three steps, about five minutes, no technical setup.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: UploadCloud,
                step: "01",
                title: "Upload your data",
                desc: "CSV or Excel up to 25MB. Column types are detected automatically and data-quality issues are flagged before anything is generated.",
              },
              {
                icon: Sparkles,
                step: "02",
                title: "Generate the report",
                desc: "Choose a focus — sales overview, monthly summary, or your own prompt. Real stats are computed first, then the narrative is written around them.",
              },
              {
                icon: BarChart3,
                step: "03",
                title: "Read, ask, forecast",
                desc: "Read the report, ask follow-ups in chat, project key metrics forward, and export everything to PDF or Word.",
              },
            ].map((s, i) => (
              <motion.div key={s.step} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.07 }}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-bold text-primary/30 tabular-nums">{s.step}</span>
                      <div className="flex size-9 items-center justify-center rounded-lg border bg-background text-primary">
                        <s.icon className="size-4" />
                      </div>
                    </div>
                    <h3 className="font-display text-base font-semibold">{s.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / accuracy */}
      <section id="trust" className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <p className="eyebrow">Accuracy</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Numbers you can put in front of your board
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Generic chatbots guess. ReportGen computes every statistic from your actual rows first, then has the AI narrate those exact results — the report says what your data says, nothing else.
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {[
                  "Deterministic stats — the AI never does arithmetic",
                  "Every chat answer shows the computation behind it",
                  "Per-workspace data isolation",
                  "Export to PDF and Word",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm leading-6">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <p className="eyebrow">Chat transparency</p>
                  <div className="mt-4 rounded-lg border bg-background px-4 py-3">
                    <p className="text-sm font-medium">"What's our best-selling category?"</p>
                  </div>
                  <div className="mt-3 rounded-lg border bg-accent/40 px-4 py-3">
                    <p className="text-sm leading-6 text-foreground/90">
                      "Accessories" leads with $64,200 in sales — 35% of total revenue, ahead of "Apparel" at $41,800.
                    </p>
                  </div>
                  <pre className="thin-scroll mt-3 overflow-x-auto rounded-lg border bg-muted/60 px-3 py-2.5 text-[11px] leading-5 text-muted-foreground">
{`GROUP-BY
SUM(Sales) GROUP BY Category, top 3 groups
Result:
[ { "label": "Accessories", "value": 64200 },
  { "label": "Apparel", "value": 41800 },
  { "label": "Home", "value": 28900 } ]`}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>      {/* Final CTA — dark, confident, no gradient tricks */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div
            {...fadeUp}
            className="rounded-2xl bg-foreground px-6 py-14 text-center text-background sm:px-12"
          >
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Your next business report is one upload away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 opacity-80">
              Start free with one dataset. Get a report you can read in five minutes and forward with confidence.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 h-11 gap-2 px-7 text-[15px]">
              <Link to={dashboardCta}>
                Get started free <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="ReportGen" className="size-6 rounded-md" />
            <span className="font-medium text-foreground">ReportGen</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-foreground">Product</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Accuracy</a>
          </div>
          <p>© {new Date().getFullYear()} ReportGen · AI business reports from your own data.</p>
        </div>
      </footer>
    </motion.div>
  );
}
