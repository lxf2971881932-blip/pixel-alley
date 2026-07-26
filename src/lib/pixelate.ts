import sharp from "sharp";

/** Working grid — matches reference sheet density (~32–40px characters). */
const GRID = 32;
/** Display size after nearest-neighbor upscale (crisp chunky pixels). */
const DISPLAY = 96;

export type AnimationFrames = {
  breathing: Buffer[];
  blink: Buffer[];
  sad: Buffer[];
  sleeping: Buffer[];
  /** Room pose: lying on bed/sofa */
  lie: Buffer[];
  /** Room pose: crouch by bowl (no eat cycle) */
  crouch: Buffer[];
};

export const FRAME_META = {
  frameSize: DISPLAY,
  pixelSize: GRID,
  style: "chibi-pixel-local-v2",
} as const;

type Rgba = { r: number; g: number; b: number; a: number };

function idx(x: number, y: number, w = GRID) {
  return (y * w + x) * 4;
}

function getPx(data: Buffer, x: number, y: number): Rgba {
  const i = idx(x, y);
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function setPx(data: Buffer, x: number, y: number, c: Rgba) {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
  const i = idx(x, y);
  data[i] = c.r;
  data[i + 1] = c.g;
  data[i + 2] = c.b;
  data[i + 3] = c.a;
}

function isOpaque(c: Rgba, threshold = 40) {
  return c.a >= threshold;
}

function luminance(c: Rgba) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function dist(a: Rgba, b: Rgba) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function softPastel(c: Rgba): Rgba {
  // Bias toward soft/warm chibi palettes from the reference sheet
  const mix = 0.18;
  return {
    r: Math.round(c.r * (1 - mix) + 255 * mix * 0.95),
    g: Math.round(c.g * (1 - mix) + 245 * mix),
    b: Math.round(c.b * (1 - mix) + 235 * mix),
    a: c.a,
  };
}

/** Median-cut-ish: reduce to N colors (opaque only), no dither. */
function quantize(data: Buffer, maxColors = 10): Buffer {
  const out = Buffer.from(data);
  const opaque: Rgba[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = getPx(out, x, y);
      if (isOpaque(c)) opaque.push(c);
    }
  }
  if (opaque.length === 0) return Buffer.from(out);

  // Seed palette with spread picks
  const palette: Rgba[] = [];
  const step = Math.max(1, Math.floor(opaque.length / maxColors));
  for (let i = 0; i < opaque.length && palette.length < maxColors; i += step) {
    palette.push(softPastel(opaque[i]));
  }
  // Force near-black outline-capable dark + blush pink into palette
  palette.push({ r: 30, g: 22, b: 18, a: 255 });
  palette.push({ r: 255, g: 170, b: 180, a: 255 });

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = getPx(out, x, y);
      if (!isOpaque(c)) {
        setPx(out, x, y, { r: 0, g: 0, b: 0, a: 0 });
        continue;
      }
      let best = palette[0];
      let bestD = Infinity;
      for (const p of palette) {
        const d = dist(c, p);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      setPx(out, x, y, { ...best, a: 255 });
    }
  }
  return Buffer.from(out);
}

/** Punch transparent holes for light background / studio backdrop. */
function punchBackground(data: Buffer): Buffer {
  const out = Buffer.from(data);
  // Sample corners as background guess
  const corners = [
    getPx(out, 0, 0),
    getPx(out, GRID - 1, 0),
    getPx(out, 0, GRID - 1),
    getPx(out, GRID - 1, GRID - 1),
  ];
  const bg = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
    a: 255,
  };

  // Only punch if corners look like a flat light backdrop
  if (luminance(bg) < 180) return Buffer.from(out);

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = getPx(out, x, y);
      if (dist(c, bg) < 2800 && luminance(c) > 170) {
        setPx(out, x, y, { r: 0, g: 0, b: 0, a: 0 });
      }
    }
  }
  return Buffer.from(out);
}

/** 1px dark outline — key look from the reference sheet. */
function addOutline(data: Buffer): Buffer {
  const src = Buffer.from(data);
  const out = Buffer.from(data);
  const outline: Rgba = { r: 28, g: 20, b: 16, a: 255 };

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = getPx(src, x, y);
      if (isOpaque(c)) continue;

      let neighbor = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        if (isOpaque(getPx(src, nx, ny))) {
          neighbor = true;
          break;
        }
      }
      if (neighbor) setPx(out, x, y, outline);
    }
  }
  return Buffer.from(out);
}

/** Tiny pink blush under approximate eye line — kawaii cue from reference. */
function addBlush(data: Buffer): Buffer {
  const out = Buffer.from(data);
  const blush: Rgba = { r: 255, g: 168, b: 178, a: 255 };
  const cx = Math.floor(GRID / 2);
  const eyeY = Math.floor(GRID * 0.38);
  const spots = [
    [cx - 6, eyeY + 2],
    [cx - 5, eyeY + 2],
    [cx + 5, eyeY + 2],
    [cx + 6, eyeY + 2],
  ];
  for (const [x, y] of spots) {
    const c = getPx(out, x, y);
    if (isOpaque(c) && luminance(c) > 90) {
      // Blend lightly
      setPx(out, x, y, {
        r: Math.round(c.r * 0.55 + blush.r * 0.45),
        g: Math.round(c.g * 0.55 + blush.g * 0.45),
        b: Math.round(c.b * 0.55 + blush.b * 0.45),
        a: 255,
      });
    }
  }
  return Buffer.from(out);
}

/** Find two darkest opaque clusters in upper face — treat as eyes. */
function findEyeCenters(data: Buffer): Array<{ x: number; y: number }> {
  type Pt = { x: number; y: number; lum: number };
  const candidates: Pt[] = [];
  const y0 = Math.floor(GRID * 0.22);
  const y1 = Math.floor(GRID * 0.48);

  for (let y = y0; y < y1; y++) {
    for (let x = 2; x < GRID - 2; x++) {
      const c = getPx(data, x, y);
      if (!isOpaque(c)) continue;
      const lum = luminance(c);
      if (lum < 70) candidates.push({ x, y, lum });
    }
  }
  candidates.sort((a, b) => a.lum - b.lum);
  if (candidates.length === 0) {
    const cx = Math.floor(GRID / 2);
    const ey = Math.floor(GRID * 0.36);
    return [
      { x: cx - 5, y: ey },
      { x: cx + 5, y: ey },
    ];
  }

  const first = candidates[0];
  let second = candidates.find((p) => Math.abs(p.x - first.x) >= 4) ?? {
    x: first.x + 8,
    y: first.y,
    lum: 0,
  };
  const eyes = [first, second].map((p) => ({ x: p.x, y: p.y }));
  eyes.sort((a, b) => a.x - b.x);
  return eyes;
}

function shiftVertical(data: Buffer, dy: number): Buffer {
  const out = Buffer.alloc(data.length, 0);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const ny = y + dy;
      if (ny < 0 || ny >= GRID) continue;
      setPx(out, x, ny, getPx(data, x, y));
    }
  }
  return Buffer.from(out);
}

function drawClosedEyes(data: Buffer, eyes: Array<{ x: number; y: number }>): Buffer {
  const out = Buffer.from(data);
  const lid: Rgba = { r: 28, g: 20, b: 16, a: 255 };
  for (const e of eyes) {
    // Clear a tiny eye blob then draw a 3px lid line
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const c = getPx(out, e.x + dx, e.y + dy);
        if (isOpaque(c) && luminance(c) < 90) {
          // Fill with nearby cheek-ish by sampling below
          const below = getPx(data, e.x, Math.min(GRID - 1, e.y + 2));
          if (isOpaque(below)) setPx(out, e.x + dx, e.y + dy, below);
        }
      }
    }
    for (const dx of [-1, 0, 1]) {
      setPx(out, e.x + dx, e.y, lid);
    }
  }
  return Buffer.from(out);
}

function drawSleepZ(data: Buffer): Buffer {
  const out = Buffer.from(data);
  const ink: Rgba = { r: 80, g: 90, b: 140, a: 255 };
  // Tiny Z in top-right empty space
  const ox = GRID - 8;
  const oy = 3;
  const plot = (x: number, y: number) => {
    if (!isOpaque(getPx(out, x, y))) setPx(out, x, y, ink);
  };
  // Z shape
  plot(ox, oy);
  plot(ox + 1, oy);
  plot(ox + 2, oy);
  plot(ox + 1, oy + 1);
  plot(ox, oy + 2);
  plot(ox + 1, oy + 2);
  plot(ox + 2, oy + 2);
  return Buffer.from(out);
}

function darken(data: Buffer, amount: number): Buffer {
  const out = Buffer.from(data);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = getPx(out, x, y);
      if (!isOpaque(c)) continue;
      setPx(out, x, y, {
        r: Math.max(0, Math.round(c.r * amount)),
        g: Math.max(0, Math.round(c.g * amount)),
        b: Math.max(0, Math.round(c.b * amount)),
        a: c.a,
      });
    }
  }
  return Buffer.from(out);
}

async function rawToDisplayPng(data: Buffer): Promise<Buffer> {
  const png = await sharp(data, {
    raw: { width: GRID, height: GRID, channels: 4 },
  })
    .resize(DISPLAY, DISPLAY, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  return Buffer.from(png);
}

/**
 * Stylize a pet photo into chibi-like pixel art:
 * cover crop → 32px grid → bg punch → limited palette → outline → blush.
 */
export async function stylizeChibiPixel(input: Buffer): Promise<Buffer> {
  const { data } = await sharp(input)
    .rotate()
    .resize(GRID, GRID, {
      fit: "cover",
      position: "attention",
      kernel: sharp.kernel.lanczos3,
    })
    // Slight contrast so features survive quantization
    .modulate({ brightness: 1.05, saturation: 1.15 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let grid: Buffer = Buffer.from(data);
  grid = Buffer.from(punchBackground(grid));
  grid = Buffer.from(quantize(grid, 9));
  grid = Buffer.from(addOutline(grid));
  grid = Buffer.from(addBlush(grid));
  return rawToDisplayPng(grid);
}

/** Keep grid-space copy for animation edits before upscale. */
async function stylizeChibiGrid(input: Buffer): Promise<Buffer> {
  const { data } = await sharp(input)
    .rotate()
    .resize(GRID, GRID, {
      fit: "cover",
      position: "attention",
      kernel: sharp.kernel.lanczos3,
    })
    .modulate({ brightness: 1.05, saturation: 1.15 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let grid: Buffer = Buffer.from(data);
  grid = Buffer.from(punchBackground(grid));
  grid = Buffer.from(quantize(grid, 9));
  grid = Buffer.from(addOutline(grid));
  grid = Buffer.from(addBlush(grid));
  return Buffer.from(grid);
}

/** @deprecated use stylizeChibiPixel */
export async function pixelateImage(input: Buffer): Promise<Buffer> {
  return stylizeChibiPixel(input);
}

export async function buildAnimationFrames(
  source: Buffer,
): Promise<{ sprite: Buffer; frames: AnimationFrames }> {
  const grid = await stylizeChibiGrid(source);
  const eyes = findEyeCenters(grid);

  const breath0 = grid;
  const breath1 = shiftVertical(grid, -1);

  const blinkOpen = grid;
  const blinkClosed = drawClosedEyes(grid, eyes);

  const sad0 = drawClosedEyes(darken(grid, 0.9), eyes);
  const sad1 = shiftVertical(sad0, 1);

  const sleep0 = drawSleepZ(drawClosedEyes(darken(grid, 0.82), eyes));
  const sleep1 = shiftVertical(sleep0, 1);

  const [
    sprite,
    breathing0,
    breathing1,
    blink0,
    blink1,
    sadFrame0,
    sadFrame1,
    sleeping0,
    sleeping1,
  ] = await Promise.all([
    rawToDisplayPng(grid),
    rawToDisplayPng(breath0),
    rawToDisplayPng(breath1),
    rawToDisplayPng(blinkOpen),
    rawToDisplayPng(blinkClosed),
    rawToDisplayPng(sad0),
    rawToDisplayPng(sad1),
    rawToDisplayPng(sleep0),
    rawToDisplayPng(sleep1),
  ]);

  return {
    sprite,
    frames: {
      breathing: [breathing0, breathing1],
      blink: [blink0, blink1],
      sad: [sadFrame0, sadFrame1],
      sleeping: [sleeping0, sleeping1],
      // Local approx: sleep frames as lie; idle as crouch placeholder
      lie: [sleeping0, sleeping1],
      crouch: [breathing0, breathing1],
    },
  };
}
