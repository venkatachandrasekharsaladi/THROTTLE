import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const throttleButton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 text-headline-sm",
        secondary: "bg-elevated text-foreground hover:bg-elevated/70 text-label-caps",
        dark: "bg-navy text-navy-foreground hover:bg-navy/90 text-label-caps",
        outline: "border border-border bg-transparent text-foreground hover:bg-elevated text-label-caps",
        ghost: "text-foreground hover:bg-elevated text-label-caps",
        link: "text-primary text-label-caps hover:underline underline-offset-4 px-0",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-13 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ThrottleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof throttleButton> {
  asChild?: boolean;
}

export const TButton = React.forwardRef<HTMLButtonElement, ThrottleButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(throttleButton({ variant, size }), className)} {...props} />;
  },
);
TButton.displayName = "TButton";
