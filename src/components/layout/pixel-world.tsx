import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const DECOR = "/decor";

export function DecorSprite({
  name,
  className,
  style,
  size,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${DECOR}/${name}.png`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={cn("select-none", className)}
      style={{ imageRendering: "pixelated", ...style }}
    />
  );
}

/**
 * Stardew Valley–inspired meadow village scenery.
 * Cottages + forest + roaming pets on grass (no beach).
 */
export function PixelWorld({
  variant = "full",
  className,
}: {
  variant?: "full" | "lite";
  className?: string;
}) {
  const full = variant === "full";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      {/* Sky clouds */}
      <DecorSprite
        name="cloud"
        size={96}
        className="pixel-cloud-drift absolute top-[5%] left-[3%] opacity-95"
      />
      <DecorSprite
        name="cloud"
        size={72}
        className="pixel-cloud-drift-slow absolute top-[10%] left-[36%] opacity-90"
      />
      <DecorSprite
        name="cloud"
        size={100}
        className="pixel-cloud-drift absolute top-[4%] right-[10%] opacity-95"
      />

      {/* Distant forest band */}
      <div
        className={cn(
          "absolute inset-x-0 pixel-forest-band",
          full ? "bottom-[34%] h-24" : "bottom-[18%] h-16",
        )}
      >
        <DecorSprite
          name="pine"
          size={88}
          className="absolute bottom-0 left-[2%]"
        />
        <DecorSprite
          name="pine"
          size={72}
          className="absolute bottom-1 left-[8%] opacity-90"
        />
        <DecorSprite
          name="pine"
          size={96}
          className="absolute bottom-0 left-[14%]"
        />
        {full && (
          <>
            <DecorSprite
              name="pine"
              size={80}
              className="absolute bottom-0 left-[42%] opacity-85"
            />
            <DecorSprite
              name="pine"
              size={100}
              className="absolute bottom-0 right-[18%]"
            />
            <DecorSprite
              name="pine"
              size={76}
              className="absolute bottom-1 right-[10%] opacity-90"
            />
            <DecorSprite
              name="pine"
              size={90}
              className="absolute bottom-0 right-[2%]"
            />
          </>
        )}
      </div>

      {/* Meadow + village */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0",
          full ? "h-[42%]" : "h-[22%]",
        )}
      >
        <div className="absolute inset-0 pixel-meadow" />
        <div className="absolute inset-x-0 top-0 h-[28%] pixel-meadow-light opacity-70" />

        {/* Stone fence strips */}
        <DecorSprite
          name="fence"
          size={80}
          className="absolute top-[18%] left-[4%] opacity-95"
        />
        <DecorSprite
          name="fence"
          size={80}
          className="absolute top-[18%] left-[12%] opacity-95"
        />
        {full && (
          <DecorSprite
            name="fence"
            size={72}
            className="absolute top-[22%] right-[28%] opacity-90"
          />
        )}

        {/* Cottages */}
        <DecorSprite
          name="cottage-l"
          size={full ? 168 : 110}
          className="absolute top-[6%] left-[6%] drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
        />
        <DecorSprite
          name="mailbox"
          size={36}
          className="absolute top-[42%] left-[22%]"
        />

        {full && (
          <>
            <DecorSprite
              name="cottage-small"
              size={120}
              className="absolute top-[10%] right-[8%] drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
            />
            <DecorSprite
              name="mailbox"
              size={32}
              className="absolute top-[48%] right-[18%]"
            />
            <DecorSprite
              name="pond"
              size={88}
              className="absolute bottom-[18%] left-[2%]"
            />
            <DecorSprite
              name="crops"
              size={64}
              className="absolute bottom-[12%] right-[4%]"
            />
            <DecorSprite
              name="bush"
              size={48}
              className="absolute top-[48%] left-[38%]"
            />
            <DecorSprite
              name="bush"
              size={40}
              className="absolute top-[52%] right-[32%]"
            />
            <DecorSprite
              name="flowers"
              size={40}
              className="absolute bottom-[28%] left-[32%]"
            />
            <DecorSprite
              name="flowers"
              size={36}
              className="absolute bottom-[22%] right-[40%]"
            />
            <DecorSprite
              name="mushroom"
              size={28}
              className="absolute bottom-[30%] left-[48%]"
            />
          </>
        )}

        {/* Roaming pets on grass (not lined up) */}
        {full ? (
          <>
            <DecorSprite
              name="dog"
              size={44}
              className="pixel-roam-a absolute bottom-[20%] left-[28%] z-[2]"
            />
            <DecorSprite
              name="cat"
              size={40}
              className="pixel-roam-b absolute bottom-[14%] left-[55%] z-[2]"
            />
            <DecorSprite
              name="duck"
              size={42}
              className="pixel-roam-c absolute bottom-[24%] left-[40%] z-[2]"
            />
            <DecorSprite
              name="hamster"
              size={36}
              className="pixel-roam-d absolute bottom-[16%] left-[70%] z-[2]"
            />
          </>
        ) : (
          <DecorSprite
            name="cat"
            size={36}
            className="pixel-roam-c absolute bottom-[18%] left-[40%] z-[2]"
          />
        )}
      </div>
    </div>
  );
}
