import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { useTheme } from "@/hooks/use-theme";
import { TButton } from "./button";

/** Sticky page header: wordmark + page title, theme toggle and optional actions. */
export function AppHeader({ title, actions }: { title?: string; actions?: ReactNode }) {
  const { isDark, setMode } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 md:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/" className="font-display text-[26px] tracking-wider text-primary lg:hidden">
            THROTTLE
          </Link>
          {title && (
            <>
              <span className="text-muted-foreground lg:hidden">/</span>
              <h1 className="truncate text-headline-sm lg:text-headline-lg">{title}</h1>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <TButton
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setMode(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-primary"
          >
            <Icon name={isDark ? "light_mode" : "dark_mode"} />
          </TButton>
        </div>
      </div>
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-28 pt-4 md:px-6 lg:px-10 lg:pb-12 lg:pt-8">
      {children}
    </main>
  );
}
