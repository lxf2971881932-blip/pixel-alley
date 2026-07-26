"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Anim = {
  type: "breathing" | "blink" | "sad" | "sleeping";
  frameUrls: string[];
  frameDurationMs: number;
  loop: boolean;
};

const LABELS: Record<Anim["type"], string> = {
  breathing: "happy",
  blink: "blink",
  sad: "sad",
  sleeping: "sleep",
};

export function PetPreview({
  spriteUrl,
  animations,
}: {
  spriteUrl: string | null;
  animations: Anim[];
}) {
  const map = useMemo(() => {
    const m = new Map<string, Anim>();
    animations.forEach((a) => m.set(a.type, a));
    return m;
  }, [animations]);

  const [mode, setMode] = useState<Anim["type"]>("breathing");
  const current = map.get(mode);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
  }, [mode]);

  useEffect(() => {
    if (!current?.frameUrls?.length) return;
    const id = window.setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= current.frameUrls.length) {
          if (current.loop) return 0;
          if (mode === "blink") {
            setMode("breathing");
            return 0;
          }
          return f;
        }
        return next;
      });
    }, current.frameDurationMs || 500);
    return () => window.clearInterval(id);
  }, [current, mode]);

  const src =
    current?.frameUrls?.[frame] ?? spriteUrl ?? current?.frameUrls?.[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex h-40 items-center justify-center border-[3px] border-wood-ink bg-[linear-gradient(45deg,#ffffff66_25%,transparent_25%),linear-gradient(-45deg,#ffffff66_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff66_75%),linear-gradient(-45deg,transparent_75%,#ffffff66_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-sand">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Pixel pet animation"
            className="h-24 w-24 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span className="pixel-label text-wood-dark/50">No frames</span>
        )}
      </div>
      <p className="text-sm font-semibold text-wood-dark/80">
        On websites: happy → (1 min idle) sad → (3 min idle) sleep. Move mouse to
        wake.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["breathing", "sad", "sleeping", "blink"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={mode === t ? "default" : "outline"}
            disabled={!map.has(t)}
            onClick={() => setMode(t)}
          >
            {LABELS[t]}
          </Button>
        ))}
      </div>
    </div>
  );
}
