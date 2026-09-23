import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Consistent page header used across the workspace pages: optional back link,
 * an uppercase eyebrow label, the page title, supporting copy, and right-aligned
 * actions. Keeps every page's rhythm identical.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  backTo,
  backLabel = "Back",
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="font-display mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
