// @refresh reset
import { useEffect, useState } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { ThemeMode } from "@/types";

export const THEME_KEY = "theme";

/** Inline script run before paint so the stored theme applies without a flash. */
export const themeBootScript = `(function(){try{var m=JSON.parse(localStorage.getItem("throttle:${THEME_KEY}")||'"light"');var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function useTheme() {
  const [mode, setMode] = useLocalStorage<ThemeMode>(THEME_KEY, "light");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  return { mode, setMode, isDark };
}

