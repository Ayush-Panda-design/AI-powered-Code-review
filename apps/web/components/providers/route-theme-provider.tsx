"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  applyThemeToDocument,
  getThemeStorageKey,
  readStoredTheme,
  type AppTheme,
} from "@/lib/route-theme";

type RouteThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  /** False on landing — no toggle, no global theme writes */
  canToggle: boolean;
};

const RouteThemeContext = createContext<RouteThemeContextValue | null>(null);

export function RouteThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  defaultTheme?: AppTheme;
}) {
  const pathname = usePathname();
  const storageKey = getThemeStorageKey(pathname);
  const canToggle = storageKey !== null;
  const [theme, setThemeState] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const stored = readStoredTheme(storageKey, defaultTheme);
    setThemeState(stored);
    applyThemeToDocument(stored);
  }, [storageKey, defaultTheme]);

  const setTheme = useCallback(
    (next: AppTheme) => {
      if (!storageKey) {
        return;
      }

      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore
      }

      setThemeState(next);
      applyThemeToDocument(next);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, setTheme, canToggle }),
    [theme, setTheme, canToggle],
  );

  return (
    <RouteThemeContext.Provider value={value}>{children}</RouteThemeContext.Provider>
  );
}

export function useRouteTheme() {
  const context = useContext(RouteThemeContext);
  if (!context) {
    throw new Error("useRouteTheme must be used within RouteThemeProvider");
  }
  return context;
}
