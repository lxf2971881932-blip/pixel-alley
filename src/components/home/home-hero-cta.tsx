"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CHROME_STORE_URL } from "@/lib/chrome-store";

export { CHROME_STORE_URL };

export function HomeHeroCta() {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center justify-center rounded-sm border-2 border-[#ff77a8]",
          "bg-black/50 px-7 py-3 font-pixel text-[11px] uppercase text-[#ff77a8]",
          "shadow-[0_0_18px_rgba(255,119,168,0.35)] backdrop-blur-sm transition-all",
          "hover:bg-[#ff77a8]/15 hover:shadow-[0_0_26px_rgba(255,119,168,0.55)]",
        )}
      >
        Free
      </a>
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
  );
}
