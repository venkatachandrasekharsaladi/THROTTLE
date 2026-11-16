import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge that THROTTLE type utilities are font-size classes,
// so they don't get merged away against text colour classes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["hero", "headline-lg", "headline-md", "headline-sm", "label-caps", "mono-badge", "data-lg", "data-md"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
