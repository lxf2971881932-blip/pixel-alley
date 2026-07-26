"use client";

import { useState } from "react";
import { COZY_DEFAULT } from "@/lib/cottage/cozy-default";

type Pose = "sit" | "lie" | "crouch";

const POSES: Pose[] = ["sit", "lie", "crouch"];

type Props = {
  poses: {
    sit?: string | null;
    lie?: string | null;
    crouch?: string | null;
  };
  petName?: string;
  cottageId?: string;
};

/**
 * Site-native bottom-right preview (not the Chrome extension).
 * Shows empty room + claimed pet; click cycles static poses.
 */
export function ClaimedCottageFloat({ poses, petName }: Props) {
  const [pose, setPose] = useState<Pose>("sit");
  const roomSrc = COZY_DEFAULT.roomSrcEmpty ?? COZY_DEFAULT.roomSrc;
  const src = poses[pose] || poses.sit;
  const anchor =
    pose === "lie"
      ? COZY_DEFAULT.anchors.bed
      : pose === "crouch"
        ? COZY_DEFAULT.anchors.bowl
        : COZY_DEFAULT.anchors.rug;

  if (!src) return null;

  return (
    <button
      type="button"
      title="Click to switch pose"
      onClick={() => {
        const i = POSES.indexOf(pose);
        setPose(POSES[(i + 1) % POSES.length]);
      }}
      className="fixed bottom-3 right-3 z-[90] w-[200px] cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-4 focus-visible:ring-honey"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm border-4 border-wood-ink bg-beige pixel-shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={roomSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={petName || "Pet"}
          className="absolute aspect-square object-contain"
          style={{
            imageRendering: "pixelated",
            left: `${anchor.x}%`,
            bottom: `${anchor.bottom}%`,
            width: `${COZY_DEFAULT.petWidthPct}%`,
            transform: "translateX(-50%)",
          }}
          draggable={false}
        />
        <span className="absolute left-1 top-1 border-2 border-wood-ink bg-cream/95 px-1 font-mono text-[10px] uppercase text-wood-ink">
          My room
        </span>
      </div>
      <p className="mt-1 text-center font-mono text-xs text-wood-dark">
        {petName || "Pet"} · {pose} · click
      </p>
    </button>
  );
}
