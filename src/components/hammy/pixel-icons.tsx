import type { CSSProperties } from "react"

/**
 * Tiny pixel-art icon engine.
 * Each icon is a string grid; every character maps to a color (or "." = transparent).
 * Rendered as crisp SVG rects so everything stays sharp at any size.
 */

type PixelMap = { grid: string[]; colors: Record<string, string> }

function PixelSprite({
  map,
  size = 24,
  className,
  style,
  title,
}: {
  map: PixelMap
  size?: number
  className?: string
  style?: CSSProperties
  title?: string
}) {
  const rows = map.grid.length
  const cols = map.grid[0]?.length ?? 0
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={size}
      className={className}
      style={{ shapeRendering: "crispEdges", ...style }}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {map.grid.flatMap((row, y) =>
        row.split("").map((ch, x) => {
          const fill = map.colors[ch]
          if (!fill) return null
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
        }),
      )}
    </svg>
  )
}

const INK = "#3e2723"
const WOOD = "#a9744f"
const WOOD_D = "#5d4037"
const ORG = "#ef8c34"
const TAN = "#f4a24c"
const HONEY = "#ffd88a"
const ROSE = "#e79a8e"
const ROSE_L = "#f6c9c0"
const SAGE = "#8fb98a"
const SAGE_D = "#5c8a5a"
const WHT = "#fdf5e6"
const BLUE = "#7db4d8"

/* -------------------------------- HEART -------------------------------- */
export function PixelHeart({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="heart"
      map={{
        colors: { K: INK, R: ROSE, r: "#d97b6e", w: WHT },
        grid: [
          ".KK..KK.",
          "KwwKKrrK",
          "KwRRRRrK",
          "KRRRRRrK",
          ".KRRRrK.",
          "..KRrK..",
          "...KK...",
          "........",
        ],
      }}
    />
  )
}

/* -------------------------------- PAW ---------------------------------- */
export function PixelPaw({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="paw print"
      map={{
        colors: { K: INK, P: WOOD },
        grid: [
          ".KK..KK.",
          "KPPKKPPK",
          "KPPKKPPK",
          ".KK..KK.",
          "..KKKK..",
          ".KPPPPK.",
          "KPPPPPPK",
          ".KKKKKK.",
        ],
      }}
    />
  )
}

/* ------------------------------- YARN ---------------------------------- */
export function PixelYarn({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="ball of yarn"
      map={{
        colors: { K: INK, Y: ROSE, y: "#d97b6e" },
        grid: [
          "..KKKK..",
          ".KYyYyK.",
          "KyYKyYyK",
          "KYyYKyYK",
          "KyKYyYyK",
          "KYyYyKyK",
          ".KyYyYK.",
          "..KKKK..",
        ],
      }}
    />
  )
}

/* -------------------------------- BONE --------------------------------- */
export function PixelBone({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="dog bone"
      map={{
        colors: { K: INK, B: WHT, s: "#e8dcc0" },
        grid: [
          "KK....KK",
          "KBBK.KBB",
          "KBBKKKBB",
          ".KBBBBBK",
          "KBBBBBK.",
          "BBKKKBBK",
          "BBK.KBBK",
          "KK....KK",
        ],
      }}
    />
  )
}

/* -------------------------------- PLANT -------------------------------- */
export function PixelPlant({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="potted plant"
      map={{
        colors: { K: INK, G: SAGE, g: SAGE_D, P: WOOD, p: WOOD_D },
        grid: [
          "...KK...",
          "..KGgK..",
          ".KGKgGK.",
          "KGgKKgGK",
          ".KGggGK.",
          "..KKKK..",
          ".KPPPPK.",
          ".KpppK..",
        ],
      }}
    />
  )
}

/* ------------------------------ FISH BOWL ------------------------------ */
export function PixelFishBowl({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="fish bowl"
      map={{
        colors: { K: INK, B: BLUE, b: "#a9d4ea", O: ORG, w: WHT },
        grid: [
          "..KKKK..",
          ".KbbbbK.",
          "KBBOOBBK",
          "KBOOKwBK",
          "KBBOOBBK",
          "KBBBBBBK",
          ".KBBBBK.",
          "..KKKK..",
        ],
      }}
    />
  )
}

/* ------------------------------ FOOD BOWL ------------------------------ */
export function PixelFoodBowl({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="food bowl"
      map={{
        colors: { K: INK, R: ROSE, r: "#d97b6e", B: TAN, b: WOOD_D },
        grid: [
          "........",
          "..KKKK..",
          ".KBbBbK.",
          "KRRRRRRK",
          "KRRRRRRK",
          ".KRRRRK.",
          "..KKKK..",
          "........",
        ],
      }}
    />
  )
}

/* -------------------------------- STAR --------------------------------- */
export function PixelStar({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="star"
      map={{
        colors: { K: INK, Y: HONEY, O: ORG },
        grid: [
          "...KK...",
          "...YK...",
          "..KYYK..",
          "KKKYYKKK",
          ".KYYYYK.",
          "..KYYK..",
          ".KYKKYK.",
          ".K....K.",
        ],
      }}
    />
  )
}

/* --------------------------------- SUN --------------------------------- */
export function PixelSun({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="sun"
      map={{
        colors: { K: INK, Y: HONEY, O: TAN },
        grid: [
          "K..KK..K",
          ".K.YY.K.",
          "..KYYK..",
          "KYYOOYYK",
          "KYYOOYYK",
          "..KYYK..",
          ".K.YY.K.",
          "K..KK..K",
        ],
      }}
    />
  )
}

/* -------------------------------- MOON --------------------------------- */
export function PixelMoon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <PixelSprite
      size={size}
      className={className}
      title="moon"
      map={{
        colors: { K: INK, Y: HONEY, o: TAN },
        grid: [
          "..KKK...",
          ".KYYoK..",
          "KYYoK.K.",
          "KYYo..KY",
          "KYYo...K",
          "KYYYoK..",
          ".KYYoK..",
          "..KKK...",
        ],
      }}
    />
  )
}
