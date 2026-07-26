import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PixelHeart,
  PixelFoodBowl,
  PixelFishBowl,
  PixelStar,
  PixelSun,
  PixelMoon,
} from "@/components/hammy/pixel-icons";

function Plaque({
  className,
  children,
}: {
  tone?: "honey" | "rose" | "sage" | "cream";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-[#ff77a8] bg-black/50 p-3 text-white shadow-[0_0_15px_rgba(255,119,168,0.2)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatBar({
  icon,
  label,
  value,
  fill,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  fill: string;
}) {
  const pct = Math.max(0, Math.min(100, Number.parseInt(value, 10)));
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-[#ff77a8]/60 bg-black/40 text-[#ff77a8]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="font-pixel text-[8px] uppercase tracking-tight text-gray-300">
            {label}
          </span>
          <span className="font-mono text-base leading-none text-white">
            {value}
          </span>
        </div>
        <div className="mt-1 h-3 w-full rounded-sm bg-gray-800">
          <div
            className={cn("h-full rounded-sm", fill)}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

export function StatusPanels() {
  return (
    <aside aria-label="Pet status" className="flex flex-col gap-4">
      <Plaque className="halftone">
        <div className="flex items-center gap-2">
          <PixelStar size={20} />
          <h2 className="font-pixel text-[10px] uppercase text-[#ff77a8]">
            Pet status
          </h2>
        </div>
        <p className="mt-2 font-mono text-lg leading-relaxed text-gray-300">
          Mochi is glowing under the midnight neon — waiting in Pixel Alley.
        </p>
      </Plaque>

      <Plaque>
        <div className="flex flex-col gap-4">
          <StatBar
            icon={<PixelHeart size={18} />}
            label="Mood"
            value="92%"
            fill="bg-[#ff77a8]"
          />
          <StatBar
            icon={<PixelFoodBowl size={18} />}
            label="Hunger"
            value="60%"
            fill="bg-[#f6d55c]"
          />
          <StatBar
            icon={<PixelFishBowl size={18} />}
            label="Thirst"
            value="78%"
            fill="bg-[#7dd3c0]"
          />
        </div>
      </Plaque>

      <Plaque>
        <div className="flex items-center gap-2">
          <PixelSun size={18} />
          <span className="font-pixel text-[9px] uppercase text-[#f6d55c]">
            Tonight
          </span>
        </div>
        <ul className="mt-2 space-y-1.5 font-mono text-base leading-relaxed text-gray-300">
          <li className="flex items-center gap-2">
            <PixelSun size={14} /> 21:00 Lantern stroll
          </li>
          <li className="flex items-center gap-2">
            <PixelStar size={14} /> 23:00 Sakura watch
          </li>
          <li className="flex items-center gap-2">
            <PixelMoon size={14} /> 01:00 Soft sleep
          </li>
        </ul>
      </Plaque>
    </aside>
  );
}
