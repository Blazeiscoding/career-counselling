"use client";

import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    // Force dark mode on mount
    const root = document.documentElement;
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  // Return null to not render anything
  return null;
}