import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
}

/** Material Symbols glyph, decorative by default. */
export function Icon({ name, filled, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined text-[20px]", filled && "icon-filled", className)}
    >
      {name}
    </span>
  );
}
