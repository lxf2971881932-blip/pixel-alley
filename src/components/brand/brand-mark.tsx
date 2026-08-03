import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/pixel-alley-cat-logo.png";

type BrandMarkProps = {
  className?: string;
  /** Pixel size of the cat mark */
  size?: number;
  /** Show “Pixel Alley” wordmark beside/below the mark */
  withWordmark?: boolean;
  /** Horizontal (nav) or stacked (hero-ish) */
  layout?: "row" | "stack";
  wordmarkClassName?: string;
  /** Wrap in home link */
  href?: string | false;
  priority?: boolean;
};

export function BrandMark({
  className,
  size = 40,
  withWordmark = true,
  layout = "row",
  wordmarkClassName,
  href = "/",
  priority = false,
}: BrandMarkProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-center",
        layout === "stack"
          ? "flex-col gap-3 sm:gap-4"
          : "flex-row gap-2.5 sm:gap-3",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- pixel art needs crisp nearest-neighbor */}
      <img
        src={LOGO_SRC}
        alt=""
        width={size}
        height={size}
        className="pixelated shrink-0 select-none"
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
        }}
        draggable={false}
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
      {withWordmark ? (
        <span
          className={cn(
            "font-pixel neon-brand uppercase leading-tight",
            layout === "stack"
              ? "text-3xl sm:text-5xl"
              : "text-[11px] sm:text-sm",
            wordmarkClassName,
          )}
        >
          Pixel Alley
        </span>
      ) : (
        <span className="sr-only">Pixel Alley</span>
      )}
    </span>
  );

  if (href === false) return mark;

  return (
    <Link
      href={href}
      className="inline-flex items-center transition-opacity hover:opacity-90"
      aria-label="Pixel Alley home"
    >
      {mark}
    </Link>
  );
}

/** Larger centered hero brand (logo above wordmark). */
export function BrandHero({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Image
        src={LOGO_SRC}
        alt=""
        width={112}
        height={112}
        priority
        unoptimized
        className="pixelated drop-shadow-[0_0_18px_rgba(125,211,252,0.45)]"
        style={{ imageRendering: "pixelated" }}
      />
      <h1 className="font-pixel neon-brand text-4xl uppercase leading-tight tracking-wide sm:text-6xl">
        Pixel Alley
      </h1>
    </div>
  );
}
