import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Status } from "@/types";

const statusStyles = cva("inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-mono-badge", {
  variants: {
    status: {
      good: "bg-success-soft text-success",
      due: "bg-gold-soft text-gold-foreground",
      urgent: "bg-primary-soft text-primary",
      info: "bg-elevated text-secondary",
    },
  },
});

export function StatusIndicator({
  status,
  label,
  dot = false,
  className,
}: {
  status: Status;
  label: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(statusStyles({ status }), className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

/** Small marker flagging fictional prototype content. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-1.5 py-0.5 text-mono-badge text-muted-foreground",
        className,
      )}
    >
      Demo data
    </span>
  );
}
