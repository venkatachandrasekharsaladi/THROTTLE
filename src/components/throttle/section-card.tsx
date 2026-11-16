import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/** Hairline-framed spec-sheet section with icon, heading and optional meta label. */
export function SectionCard({
  icon,
  title,
  meta,
  children,
  className,
  id,
}: {
  icon: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("hairline-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="text-primary" />
          <h2 id={id ? `${id}-title` : undefined} className="text-headline-md">
            {title}
          </h2>
        </div>
        {meta && <div className="text-label-caps text-secondary">{meta}</div>}
      </header>
      {children}
    </section>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-label-caps text-secondary">{children}</h2>
      {action}
    </div>
  );
}
