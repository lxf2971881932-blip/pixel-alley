"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/hammy/pixel-button";
import { PixelPaw, PixelStar, PixelHeart } from "@/components/hammy/pixel-icons";

export function PixelModal({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border-2 border-[#ff77a8] bg-black/70 p-5 shadow-[0_0_28px_rgba(255,119,168,0.35)] backdrop-blur-md",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PixelWaitAnim() {
  return (
    <div className="flex flex-col items-center gap-4 py-2" aria-hidden>
      <div className="relative flex h-20 w-28 items-end justify-center gap-1">
        <span className="inline-block animate-[hammy-bob_0.9s_ease-in-out_infinite] text-[#ff77a8]">
          <PixelPaw size={40} />
        </span>
        <span className="mb-2 inline-block animate-[hammy-bob_0.9s_ease-in-out_infinite] [animation-delay:0.15s] text-[#f6d55c]">
          <PixelStar size={22} />
        </span>
        <span className="mb-1 inline-block animate-[hammy-bob_0.9s_ease-in-out_infinite] [animation-delay:0.3s] text-[#ff77a8]">
          <PixelHeart size={20} />
        </span>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 rounded-sm border-2 border-[#ff77a8] bg-[#ff77a8]"
            style={{
              animation: `hammy-bob 0.8s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function GeneratingModal({
  open,
  step,
}: {
  open: boolean;
  step: "uploading" | "generating" | "polling";
}) {
  const label =
    step === "uploading"
      ? "Uploading photo…"
      : step === "polling"
        ? "Almost there…"
        : "Pixelating your pet…";

  return (
    <PixelModal open={open}>
      <h2 className="pixel-label text-center text-[#ff77a8]">Please wait</h2>
      <PixelWaitAnim />
      <p className="mt-2 text-center font-mono text-lg text-white">{label}</p>
      <p className="mt-1 text-center font-mono text-base text-gray-400">
        Keep this tab open — usually 30–90 seconds.
      </p>
    </PixelModal>
  );
}

/** Shown after generate — sync code for Chrome new-tab home */
export function SyncReadyModal({
  open,
  syncCode,
  petName,
  poses,
  onClose,
}: {
  open: boolean;
  syncCode: string | null;
  petName?: string;
  poses?: {
    sit?: string | null;
    lie?: string | null;
    crouch?: string | null;
  } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const sit = poses?.sit;

  async function copyCode() {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <PixelModal open={open}>
      <h2 className="text-center font-pixel neon-brand text-[11px] uppercase leading-relaxed">
        Your pet is ready!
      </h2>
      <p className="mt-3 text-center font-mono text-lg leading-relaxed text-gray-300">
        Install the extension, open a <strong className="text-white">new tab</strong>,
        and enter this sync code to bring your pet into Pixel Alley.
      </p>

      {sit ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-[#ff77a8]/60 bg-black/40 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sit}
            alt={petName || "Pet"}
            className="h-24 w-24 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="mt-2 font-mono text-sm text-gray-400">
            Midnight Lofi pet · 1 pose
          </p>
        </div>
      ) : null}

      {petName ? (
        <p className="mt-2 text-center font-mono text-base text-white">
          {petName}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border-2 border-[#ff77a8] bg-[#ff77a8]/10 px-3 py-4 text-center shadow-[0_0_15px_rgba(255,119,168,0.25)]">
        <p className="pixel-label text-[#ff77a8]">Sync code</p>
        <p className="mt-2 font-pixel text-2xl tracking-widest text-white text-pixel-outline">
          {syncCode || "····"}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <PixelButton
            variant="wood"
            type="button"
            disabled={!syncCode}
            onClick={() => void copyCode()}
          >
            {copied ? "Copied!" : "Copy code"}
          </PixelButton>
        </div>
        <p className="mt-2 font-mono text-sm text-gray-400">
          Valid for 7 days · works on any browser with the extension
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <PixelButton
          variant="orange"
          className="w-full"
          type="button"
          onClick={() => setShowGuide((v) => !v)}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <PixelPaw size={16} />
            Get extension
          </span>
        </PixelButton>
        <PixelButton
          variant="honey"
          className="w-full"
          type="button"
          onClick={onClose}
        >
          Done
        </PixelButton>
      </div>

      {showGuide ? (
        <ol className="mt-4 space-y-2 font-mono text-base leading-relaxed text-gray-300">
          <li className="rounded-xl border-2 border-[#ff77a8]/40 bg-black/40 px-3 py-2">
            <span className="pixel-label text-[#ff77a8]">1</span> Open{" "}
            <strong className="text-white">chrome://extensions</strong> →
            Developer mode → Load unpacked → select{" "}
            <code className="pixel-label text-[#f6d55c]">extension/</code>
          </li>
          <li className="rounded-xl border-2 border-[#ff77a8]/40 bg-black/40 px-3 py-2">
            <span className="pixel-label text-[#ff77a8]">2</span> Open a{" "}
            <strong className="text-white">new tab</strong> — Pixel Alley appears
          </li>
          <li className="rounded-xl border-2 border-[#ff77a8]/40 bg-black/40 px-3 py-2">
            <span className="pixel-label text-[#ff77a8]">3</span> Enter{" "}
            <strong className="text-white">{syncCode || "your code"}</strong> →
            Sync my pet
          </li>
        </ol>
      ) : null}
    </PixelModal>
  );
}
