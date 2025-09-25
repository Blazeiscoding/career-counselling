"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme());

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      aria-label="Toggle dark mode"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      onClick={toggle}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Sun (shown in light) */}
      <Sun
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      {/* Moon (shown in dark) */}
      <Moon
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
