import { useCallback, useEffect, useState } from "react";

const EVENT = "throttle-storage";
export const STORAGE_PREFIX = "throttle:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * SSR-safe localStorage state. Renders the fallback on the server and first
 * client paint, then syncs from storage; updates broadcast to every hook
 * using the same key.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(read(key, fallback));
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail == null || detail === key) setValue(read(key, fallback));
    };
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(read(key, fallback)) : next;
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(resolved));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update] as const;
}

export function clearThrottleStorage() {
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Toggle membership of an id in a stored list. */
export function useStoredSet(key: string) {
  const [ids, setIds] = useLocalStorage<string[]>(key, []);
  const toggle = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return [ids, toggle] as const;
}
