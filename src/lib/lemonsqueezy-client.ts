"use client";

import { withLemonEmbed } from "@/lib/lemonsqueezy";

export type LemonCheckoutKind = "premium" | "credits";

export type LemonJsEvent = {
  event: string;
  data?: unknown;
};

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (opts: { eventHandler: (event: LemonJsEvent) => void }) => void;
      Url: { Open: (url: string) => void; Close?: () => void };
    };
  }
}

let lemonInitialized = false;

export function ensureLemonJs(eventHandler?: (event: LemonJsEvent) => void) {
  if (typeof window === "undefined") return false;
  if (typeof window.createLemonSqueezy === "function") {
    window.createLemonSqueezy();
  }
  if (!window.LemonSqueezy) return false;
  if (eventHandler) {
    window.LemonSqueezy.Setup({ eventHandler });
    lemonInitialized = true;
  } else if (!lemonInitialized) {
    window.LemonSqueezy.Setup({ eventHandler: () => undefined });
    lemonInitialized = true;
  }
  return Boolean(window.LemonSqueezy.Url?.Open);
}

export function openLemonCheckout(
  checkoutUrl: string,
  eventHandler?: (event: LemonJsEvent) => void,
): boolean {
  const ready = ensureLemonJs(eventHandler);
  const url = withLemonEmbed(checkoutUrl);
  if (ready && window.LemonSqueezy?.Url?.Open) {
    window.LemonSqueezy.Url.Open(url);
    return true;
  }
  // Fallback: new tab if Lemon.js failed to load
  window.open(url, "_blank", "noopener,noreferrer");
  return false;
}
