import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="hero-backdrop flex min-h-screen flex-col bg-background"
    >
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ReportGen" className="size-8 rounded-lg" />
            <span className="font-display text-base font-bold tracking-tight">
              ReportGen
            </span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="w-full max-w-lg text-center"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-card text-primary shadow-sm">
            <Compass className="size-6" />
          </div>
          <p className="eyebrow mt-6">Error 404</p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            We couldn't find that page
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The link may be broken or the page may have moved. Your data and
            reports are safe in your workspace.
          </p>
          {pathname && pathname !== "/" && (
            <p className="mx-auto mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              <span className="font-medium">Requested:</span>
              <code className="truncate">{pathname}</code>
            </p>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="h-10 gap-2 px-5">
              <Link to="/">
                Back to home <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-5">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
