"use client";

import { useEffect } from "react";
import {
  applyThemeColorMeta,
  pageThemeColorFromStyle,
} from "@/lib/browser-theme-color";

function syncThemeColor() {
  const color = pageThemeColorFromStyle(
    getComputedStyle(document.documentElement),
  );
  applyThemeColorMeta(document, color);
}

export default function ThemeColor() {
  useEffect(() => {
    syncThemeColor();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncThemeColor();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}
