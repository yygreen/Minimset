"use client";

import { useEffect } from "react";

/** Flip the document to Hebrew/RTL while a Hebrew route is mounted. */
export function HeLang() {
  useEffect(() => {
    const el = document.documentElement;
    const prevLang = el.getAttribute("lang");
    const prevDir = el.getAttribute("dir");
    el.setAttribute("lang", "he");
    el.setAttribute("dir", "rtl");
    return () => {
      el.setAttribute("lang", prevLang || "en");
      if (prevDir) el.setAttribute("dir", prevDir);
      else el.removeAttribute("dir");
    };
  }, []);
  return null;
}
