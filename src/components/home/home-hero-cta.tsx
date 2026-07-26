"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Replace when the listing goes live. */
export const CHROME_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_STORE_URL ||
  "https://chromewebstore.google.com/detail/pixel-alley/PLACEHOLDER";

export function HomeHeroCta() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center justify-center rounded-sm border-2 border-[#ff77a8]",
            "bg-black/50 px-7 py-3 font-pixel text-[11px] uppercase text-[#ff77a8]",
            "shadow-[0_0_18px_rgba(255,119,168,0.35)] backdrop-blur-sm transition-all",
            "hover:bg-[#ff77a8]/15 hover:shadow-[0_0_26px_rgba(255,119,168,0.55)]",
          )}
        >
          Free
        </button>
        <Link
          href="/upload"
          className={cn(
            "inline-flex items-center justify-center rounded-sm border-2 border-[#f6d55c]",
            "bg-[#f6d55c] px-8 py-3 font-pixel text-[11px] uppercase text-[#0b0f19]",
            "shadow-[0_0_20px_rgba(246,213,92,0.45)] transition-all",
            "hover:bg-[#ffe566] hover:shadow-[0_0_28px_rgba(246,213,92,0.7)]",
          )}
        >
          Upload
        </Link>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-xl border-2 border-[#ff77a8] bg-[#0b0f19]/95 p-5 shadow-[0_0_32px_rgba(255,119,168,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="font-pixel text-[11px] leading-relaxed text-[#ff77a8] sm:text-xs"
            >
              Get the free Chrome extension
            </h2>
            <p className="mt-3 font-mono text-base leading-relaxed text-gray-300">
              Install Pixel Alley from the Chrome Web Store, then open a new tab
              to enjoy the midnight alley right away — no code needed to enter
              the scene.
            </p>

            <ol className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-gray-300">
              <li className="rounded-lg border border-[#ff77a8]/40 bg-black/40 px-3 py-2">
                <span className="text-[#ff77a8]">1.</span> Open the Chrome Web
                Store listing
              </li>
              <li className="rounded-lg border border-[#ff77a8]/40 bg-black/40 px-3 py-2">
                <span className="text-[#ff77a8]">2.</span> Click{" "}
                <strong className="text-white">Add to Chrome</strong>
              </li>
              <li className="rounded-lg border border-[#ff77a8]/40 bg-black/40 px-3 py-2">
                <span className="text-[#ff77a8]">3.</span> Open a{" "}
                <strong className="text-white">new tab</strong> to see the alley
              </li>
            </ol>

            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-5 flex w-full items-center justify-center rounded-sm border-2 border-[#ff77a8]",
                "bg-[#ff0055]/25 px-4 py-3 font-pixel text-[10px] uppercase text-white",
                "shadow-[0_0_20px_rgba(255,119,168,0.45)] transition",
                "hover:bg-[#ff0055]/40",
              )}
            >
              Open Chrome Web Store
            </a>

            <p className="mt-3 break-all font-mono text-xs text-gray-500">
              Placeholder link — replace when published:
              <br />
              {CHROME_STORE_URL}
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-sm border border-white/20 bg-transparent py-2 font-mono text-sm text-gray-300 transition hover:border-[#ff77a8]/50 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
