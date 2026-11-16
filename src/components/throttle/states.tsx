import type { ReactNode } from "react";
import { Icon } from "./icon";

export function EmptyState({
  icon = "search_off",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated text-muted-foreground">
        <Icon name={icon} className="text-[24px]" />
      </span>
      <div>
        <p className="text-headline-sm">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-16">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-6 w-1.5 -skew-x-12 animate-pulse bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-mono-badge text-muted-foreground">{label}…</span>
    </div>
  );
}
