"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "orange" | "honey" | "rose" | "sage" | "wood";

const variantMap: Record<Variant, string> = {
  orange:
    "bg-black/60 text-[#ff77a8] hover:bg-[#ff77a8] hover:text-white hover:shadow-[0_0_20px_rgba(255,119,168,0.6)]",
  honey:
    "bg-[#f6d55c]/15 text-[#f6d55c] border-[#f6d55c] hover:bg-[#f6d55c] hover:text-[#0b0f19]",
  rose: "bg-[#ff77a8]/20 text-[#ff77a8] hover:bg-[#ff77a8] hover:text-white",
  sage: "bg-[#7dd3c0]/15 text-[#7dd3c0] border-[#7dd3c0] hover:bg-[#7dd3c0] hover:text-[#0b0f19]",
  wood: "bg-black/50 text-white hover:bg-white/10",
};

export function PixelButton({
  children,
  variant = "orange",
  className,
  ...props
}: {
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "font-sans uppercase tracking-tight transition-all",
        "border-2 border-[#ff77a8] rounded-xl px-6 py-3 text-[10px] sm:text-xs leading-relaxed",
        "shadow-[0_0_15px_rgba(255,119,168,0.2)]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ff77a8]/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
