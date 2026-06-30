export type AppTheme = "light" | "dark";

/** Separate persisted theme per app area (not shared across routes). */
export function getThemeStorageKey(pathname: string): string | null {
  if (pathname === "/") {
    return null;
  }

  if (pathname.startsWith("/dashboard")) {
    return "shipflow-theme-dashboard";
  }

  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/invite")
  ) {
    return "shipflow-theme-auth";
  }

  return "shipflow-theme-other";
}

export function readStoredTheme(storageKey: string, fallback: AppTheme = "dark"): AppTheme {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // private mode / blocked storage
  }

  return fallback;
}

export function applyThemeToDocument(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}
