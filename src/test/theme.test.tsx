import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks/use-theme";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

describe("resolved theme appearance", () => {
  it("follows a dark system theme and switches to explicit light", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    localStorage.setItem("throttle:theme", JSON.stringify("system"));
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("system");
    expect(result.current.isDark).toBe(true);
    act(() => result.current.setMode(result.current.isDark ? "light" : "dark"));
    expect(result.current.mode).toBe("light");
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows system appearance changes while in system mode", () => {
    let matches = false;
    let onChange: (() => void) | undefined;
    vi.spyOn(window, "matchMedia").mockReturnValue({
      get matches() { return matches; },
      addEventListener: (_event: string, callback: () => void) => { onChange = callback; },
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    localStorage.setItem("throttle:theme", JSON.stringify("system"));
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
    act(() => { matches = true; onChange?.(); });
    expect(result.current.isDark).toBe(true);
    expect(result.current.mode).toBe("system");
  });
});