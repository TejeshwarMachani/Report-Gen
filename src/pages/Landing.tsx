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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import logo from "@/assets/logo.svg";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const dashboardCta = isAuthenticated ? "/dashboard" : "/auth";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background"
    >
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Insight Navigator" className="size-8 rounded-lg" />
            <span className="font-display text-base font-bold tracking-tight">Insight Navigator</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Trust</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>Sign in</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to={dashboardCta}>
                Get started <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-backdrop">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
          <motion.div {...fadeUp}>
            <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5 text-primary" />
              AI reports from your own business data
            </Badge>
          </motion.div>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="font-display max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
          >
            Turn your spreadsheets into{" "}
            <span className="text-primary">reports people actually read</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            Upload a CSV or Excel file and get a plain-English business report with headline metrics and charts in minutes. Ask follow-up questions, forecast what's next — no formulas, no analyst, no setup.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
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
            Free to start · No credit card · Your data stays yours
          </motion.p>

          {/* Hero preview card */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.25 }}
            className="mt-14 w-full max-w-4xl"
          >
            <div className="rounded-2xl border bg-card p-1.5 shadow-2xl shadow-primary/10">
              <div className="rounded-xl border bg-background p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <BarChart3 className="size-4" />
                    </div>
                    <span className="text-sm font-semibold">Monthly business report</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[11px]">Generated in 24s</Badge>
                </div>
                <div className="grid gap-4 pt-4 sm:grid-cols-3">
                  {[
                    { label: "Total revenue", value: "$182,400", change: "+12.4%", up: true },
                    { label: "Orders", value: "1,208", change: "+6.1%", up: true },
                    { label: "Avg. order value", value: "$151", change: "-2.3%", up: false },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border bg-card px-4 py-3 text-left">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                      <p className="font-display tabular-nums mt-1 text-xl font-bold">{m.value}</p>
                      <p className={`mt-0.5 text-xs font-medium ${m.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {m.change} vs last month
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border bg-card px-4 py-3 text-left">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Sparkles className="size-3 text-primary" /> AI insight
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground/90">
                    Revenue grew 12.4% across the period, driven mostly by the “Online” segment, which accounted for 48% of total sales. Watch order value: it slipped 2.3% even as volume rose.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you'd ask a data analyst — minus the analyst
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              One tool for reports, answers, and forecasts on the data you already have.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Instant business reports",
                desc: "Upload a file, pick a focus, get a polished narrative report with headline metrics and 3–5 charts. Export to PDF or Word.",
              },
              {
                icon: MessageSquareText,
                title: "Chat with your data",
                desc: "Ask questions in plain English. Every answer shows the exact computation it ran — full transparency, no black box.",
              },
              {
                icon: TrendingUp,
                title: "Simple forecasting",
                desc: "Pick a metric and a date column, project 3–12 months ahead with a confidence band, in plain language.",
              },
              {
                icon: ShieldCheck,
                title: "Trustworthy by design",
                desc: "All statistics are computed deterministically from your data. The AI writes the story — it never invents the numbers.",
              },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
                <Card className="card-hover h-full">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
      <section id="how" className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
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
                step: "1",
                title: "Upload your data",
                desc: "CSV or Excel up to 25MB. We detect column types automatically and flag data-quality issues before anything is generated.",
              },
              {
                icon: Sparkles,
                step: "2",
                title: "Generate the report",
                desc: "Choose a focus — sales overview, monthly summary, or your own prompt. We compute the stats, then the AI writes the narrative around them.",
              },
              {
                icon: BarChart3,
                step: "3",
                title: "Read, ask, forecast",
                desc: "Read the report, chat with the dataset for follow-ups, and project key metrics forward. Export everything to PDF or Word.",
              },
            ].map((s, i) => (
              <motion.div key={s.step} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {s.step}
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <s.icon className="size-5" />
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

      {/* Trust */}
      <section id="trust" className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Numbers you can put in front of your board
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Generic chatbots guess. Insight Navigator computes every statistic from your actual rows first, then has the AI narrate those exact results — so the report says what your data says, nothing else.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Deterministic stats — the AI never does arithmetic",
                  "Transparent computations shown for every chat answer",
                  "Per-workspace data isolation",
                  "Export to PDF and Word for sharing",
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chat transparency</p>
                  <div className="mt-4 rounded-xl border bg-background px-4 py-3">
                    <p className="text-sm font-medium">"What's our best-selling category?"</p>
                  </div>
                  <div className="mt-3 rounded-xl border bg-accent/40 px-4 py-3">
                    <p className="text-sm leading-6 text-foreground/90">
                      “Accessories” leads with $64,200 in sales — 35% of total revenue, ahead of “Apparel” at $41,800.
                    </p>
                  </div>
                  <pre className="thin-scroll mt-3 overflow-x-auto rounded-lg border bg-muted/60 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
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
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div
            {...fadeUp}
            className="hero-backdrop relative overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center sm:px-12"
          >
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Your next business report is one upload away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Start free with one dataset. Get a report you can read in five minutes and forward with confidence.
            </p>
            <Button asChild size="lg" className="mt-8 h-11 gap-2 px-7 text-[15px]">
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
            <img src={logo} alt="logo" className="size-6 rounded-md" />
            <span className="font-medium text-foreground">Insight Navigator</span>
          </div>
          <p>AI business reports from your own data.</p>
        </div>
      </footer>
    </motion.div>
  );
}
