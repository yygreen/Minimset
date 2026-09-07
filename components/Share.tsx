"use client";

import { useEffect, useState } from "react";

/**
 * WhatsApp share + copy link. This audience passes links around in shul and
 * family chats, so every page that sells gets one of these. The href carries the
 * real origin once mounted (so long-press / "copy link address" works too).
 */
export function Share({
  path,
  text,
  label = "Share on WhatsApp",
  copyLabel = "Copy link",
  compact = false,
  stretch = false,
}: {
  path: string;
  text: string;
  label?: string;
  copyLabel?: string;
  compact?: boolean;
  /** Two equal full-width buttons (narrow cards on phones). */
  stretch?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://4minimset.com");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin + path;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  return (
    <div className={stretch ? "grid grid-cols-2 gap-2" : `flex flex-wrap items-center gap-2 ${compact ? "" : "gap-3"}`}>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-lg border-2 border-leaf-800 font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white ${
          compact ? "h-10 px-3.5 text-[14px]" : "h-12 px-5 text-[15px]"
        } ${stretch ? "w-full justify-center px-2" : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.5.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3Z" />
        </svg>
        {label}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard blocked: nothing to do */
          }
        }}
        className={`inline-flex items-center rounded-lg border border-sand-300 bg-white font-semibold text-ink-900 transition hover:border-leaf-700 ${
          compact ? "h-10 px-3.5 text-[14px]" : "h-12 px-5 text-[15px]"
        } ${stretch ? "w-full justify-center px-2" : ""}`}
      >
        {copied ? "Copied" : copyLabel}
      </button>
    </div>
  );
}
