import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "i-track-theme";

function getInitialTheme() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent("i-track-theme-change", { detail: theme }));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<"dark" | "light">).detail;
      if (next === "dark" || next === "light") setTheme(next);
    };
    window.addEventListener("i-track-theme-change", handleThemeChange);
    return () => window.removeEventListener("i-track-theme-change", handleThemeChange);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(nextTheme)}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline text-xs font-medium">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
