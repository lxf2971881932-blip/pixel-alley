"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  getCottage,
  type CottageAnchorId,
  type CottageDef,
} from "@/lib/cottage/cozy-default";
import {
  PixelFishBowl,
  PixelFoodBowl,
  PixelHeart,
  PixelMoon,
  PixelPaw,
} from "@/components/hammy/pixel-icons";

export type RoomPoseMap = {
  idle?: string | null;
  lie?: string | null;
  crouch?: string | null;
  /** optional breathing frames for idle bob */
  idleFrames?: string[];
};

type Props = {
  poses?: RoomPoseMap;
  cottageId?: string;
  className?: string;
  /** Show hover interaction menu */
  interactive?: boolean;
  /** Auto roam between floor / bed / bowl */
  autoLive?: boolean;
  /** Use empty room art (no baked-in animals) — for upload page */
  emptyRoom?: boolean;
};

function pickSrc(
  poses: RoomPoseMap | undefined,
  pose: "idle" | "lie" | "crouch",
): string | null {
  if (!poses) return null;
  if (pose === "lie") return poses.lie || poses.idle || null;
  if (pose === "crouch") return poses.crouch || poses.idle || null;
  if (poses.idleFrames?.length) return poses.idleFrames[0];
  return poses.idle || null;
}

export function RoomStage({
  poses,
  cottageId = "cozy-default",
  className,
  interactive = true,
  autoLive = true,
  emptyRoom = false,
}: Props) {
  const cottage: CottageDef = useMemo(
    () => getCottage(cottageId),
    [cottageId],
  );

  const roomSrc =
    emptyRoom && cottage.roomSrcEmpty
      ? cottage.roomSrcEmpty
      : cottage.roomSrc;

  const [anchorId, setAnchorId] = useState<CottageAnchorId>("rug");
  const [moving, setMoving] = useState(false);
  const [hover, setHover] = useState(false);
  const [frameTick, setFrameTick] = useState(0);

  const anchor = cottage.anchors[anchorId];
  const pose = anchor.pose;
  const src = pickSrc(poses, pose);

  // Idle frame bob when standing
  useEffect(() => {
    if (pose !== "idle" || !poses?.idleFrames?.length) return;
    const id = window.setInterval(() => {
      setFrameTick((t) => t + 1);
    }, 420);
    return () => window.clearInterval(id);
  }, [pose, poses?.idleFrames?.length]);

  const displaySrc =
    pose === "idle" && poses?.idleFrames?.length
      ? poses.idleFrames[frameTick % poses.idleFrames.length]
      : src;

  const goTo = useCallback(
    (id: CottageAnchorId) => {
      if (id === anchorId) return;
      setMoving(true);
      // Brief travel then snap to target (pose switches on arrival)
      window.setTimeout(() => {
        setAnchorId(id);
        setMoving(false);
      }, 480);
    },
    [anchorId],
  );

  // Auto lifestyle loop: roam → sometimes bed → sometimes bowl
  useEffect(() => {
    if (!autoLive || !displaySrc) return;
    let cancelled = false;
    let roamIdx = 0;

    const tick = () => {
      if (cancelled) return;
      const roll = Math.random();
      if (roll < 0.22) {
        goTo("bed");
      } else if (roll < 0.4) {
        goTo("bowl");
      } else {
        roamIdx = (roamIdx + 1) % cottage.roamPath.length;
        goTo(cottage.roamPath[roamIdx]);
      }
    };

    // Stay longer on bed/bowl
    const delay =
      anchorId === "bed" || anchorId === "bowl"
        ? 7000 + Math.random() * 4000
        : 3500 + Math.random() * 2500;

    const timer = window.setTimeout(tick, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoLive, displaySrc, anchorId, cottage.roamPath, goTo]);

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="rounded-xl border-2 border-[#ff77a8] bg-black/40 p-2 shadow-[0_0_15px_rgba(255,119,168,0.25)] backdrop-blur-md">
        <div className="rounded-xl border border-[#ff77a8]/40 bg-black/30 p-1">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#ff77a8]/30 bg-[#0b0f19]">
            <Image
              src={roomSrc}
              alt={cottage.name}
              fill
              sizes="(max-width: 768px) 100vw, 520px"
              className="pixelated object-cover"
              priority
            />

            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displaySrc}
                alt="Pet in room"
                className={cn(
                  "pointer-events-none absolute pixelated object-contain transition-[left,bottom,opacity] duration-500 ease-out",
                  moving && "opacity-80",
                  pose === "idle" && "animate-[hammy-bob_2.4s_ease-in-out_infinite]",
                )}
                style={{
                  left: `${anchor.x}%`,
                  bottom: `${anchor.bottom}%`,
                  width: `${cottage.petWidthPct}%`,
                  height: "auto",
                  transform: "translate(-50%, 0)",
                  zIndex: anchor.z,
                  imageRendering: "pixelated",
                }}
              />
            ) : null}

            <div className="absolute left-2 top-2 z-40 flex items-center gap-1.5 rounded-lg border-2 border-[#ff77a8] bg-black/70 px-2 py-1 backdrop-blur-sm">
              <PixelPaw size={14} />
              <span className="font-pixel text-[8px] uppercase text-[#ff77a8]">
                {cottage.name}
              </span>
            </div>

            {/* Hover menu — drink / pet / sleep / feed */}
            {interactive && hover && displaySrc ? (
              <div className="absolute right-2 top-2 z-50 flex flex-col gap-1.5">
                {(
                  [
                    {
                      label: "Drink",
                      icon: <PixelFishBowl size={14} />,
                      target: "bowl" as const,
                    },
                    {
                      label: "Pet",
                      icon: <PixelHeart size={14} />,
                      target: "rug" as const,
                    },
                    {
                      label: "Sleep",
                      icon: <PixelMoon size={14} />,
                      target: "bed" as const,
                    },
                    {
                      label: "Feed",
                      icon: <PixelFoodBowl size={14} />,
                      target: "bowl" as const,
                    },
                  ] as const
                ).map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-sm border-2 border-wood-ink bg-honey px-2 py-1 font-sans text-[8px] uppercase text-wood-ink pixel-shadow hover:translate-x-px hover:translate-y-px"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(btn.target);
                    }}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
