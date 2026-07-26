import sharp from "sharp";

/**
 * Post-process AI sprites for desktop-pet use:
 * - chroma-key flat magenta/green screen (safe for black pets)
 * - never punch dark fur into transparency
 * - binary alpha (no semi-transparent mush)
 * - strip bright white edge halos that flash in animation
 */

function px(data: Buffer, w: number, x: number, y: number) {
  const i = (y * w + x) * 4;
  return { i, r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function isMagenta(r: number, g: number, b: number) {
  // #FF00FF screen + near-magenta fringe
  return r > 200 && b > 200 && g < 80;
}

function isScreenGreen(r: number, g: number, b: number) {
  return g > 200 && r < 80 && b < 80;
}

function isNearWhite(r: number, g: number, b: number) {
  return r > 245 && g > 245 && b > 245;
}

function isBrightHalo(r: number, g: number, b: number) {
  // white / pale flash often left on silhouette edges
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max > 230 && max - min < 40;
}

/**
 * Edge flood-fill chroma screens. Leonardo often outputs mid greens like
 * #71C668 (not pure #00FF00) — match green-dominant fills from the border.
 * Keeps white fur and magenta neon rim (those are not green-dominant).
 */
export async function keyChromaScreen(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  const visited = new Uint8Array(w * h);

  function idx(x: number, y: number) {
    return y * w + x;
  }

  function colorDist(
    r: number,
    g: number,
    b: number,
    r2: number,
    g2: number,
    b2: number,
  ) {
    const dr = r - r2;
    const dg = g - g2;
    const db = b - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /** Green-dominant screen (covers #00FF00 and #71C668-style fills) */
  function isGreenScreen(r: number, g: number, b: number, a: number) {
    if (a < 16) return true;
    if (g < 85) return false;
    // G must clearly lead R and B (pet white/blue/magenta won't)
    if (g < r + 20 || g < b + 20) return false;
    return true;
  }

  function isMagentaScreen(r: number, g: number, b: number) {
    return r >= 200 && b >= 200 && g <= 45;
  }

  function isScreen(r: number, g: number, b: number, a: number) {
    return isGreenScreen(r, g, b, a) || isMagentaScreen(r, g, b);
  }

  const queue: number[] = [];
  const seeds: Array<{ r: number; g: number; b: number }> = [];

  const pushEdge = (x: number, y: number) => {
    const p = idx(x, y);
    if (visited[p]) return;
    const i = p * 4;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];
    if (!isScreen(r, g, b, a)) return;
    visited[p] = 1;
    queue.push(p);
    seeds.push({ r, g, b });
  };

  for (let x = 0; x < w; x++) {
    pushEdge(x, 0);
    pushEdge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushEdge(0, y);
    pushEdge(w - 1, y);
  }

  // Also sample a few inset border rows in case of 1px anti-aliased frame
  for (let x = 0; x < w; x++) {
    if (h > 2) {
      pushEdge(x, 1);
      pushEdge(x, h - 2);
    }
  }

  const matchesScreen = (r: number, g: number, b: number, a: number) => {
    if (isScreen(r, g, b, a)) return true;
    // Soft fringe near green seeds (anti-aliased edge of screen)
    for (const s of seeds) {
      if (colorDist(r, g, b, s.r, s.g, s.b) <= 48 && g >= r && g >= b) {
        return true;
      }
    }
    return false;
  };

  while (queue.length) {
    const p = queue.pop()!;
    const x = p % w;
    const y = (p / w) | 0;
    out[p * 4 + 3] = 0;

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const np = idx(nx, ny);
      if (visited[np]) continue;
      const ni = np * 4;
      if (!matchesScreen(out[ni], out[ni + 1], out[ni + 2], out[ni + 3])) {
        continue;
      }
      visited[np] = 1;
      queue.push(np);
    }
  }

  for (let i = 0; i < out.length; i += 4) {
    out[i + 3] = out[i + 3] >= 128 ? 255 : 0;
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Flood-fill backgrounds from image edges.
 * Keys solid studio fills (green / magenta / black / white) and
 * desaturated / dark room leftovers connected to the border.
 * Avoids eating cream/tan pet fur by requiring bg-like pixels.
 */
export async function removeSolidBackground(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  const visited = new Uint8Array(w * h);

  function idx(x: number, y: number) {
    return y * w + x;
  }

  function colorDist(
    r: number,
    g: number,
    b: number,
    r2: number,
    g2: number,
    b2: number,
  ) {
    const dr = r - r2;
    const dg = g - g2;
    const db = b - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function isChromaKey(r: number, g: number, b: number, a: number) {
    if (a < 16) return true;
    // bright green screen #00FF00 (+ mid greens)
    if (g >= 120 && g >= r + 35 && g >= b + 35) return true;
    if (isMagenta(r, g, b) || isScreenGreen(r, g, b)) return true;
    if (r <= 40 && g <= 40 && b <= 40) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max <= 55 && max - min <= 12) return true;
    if (isNearWhite(r, g, b)) return true;
    return false;
  }

  /** Gray / murky photo-bg — not saturated pet fur */
  function isDesaturatedBg(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.22 && max > 25 && max < 230) return true;
    // warm indoor blur often low-mid saturation browns at edges
    if (sat < 0.35 && max < 160 && r > g - 10 && g > b && r - b < 80) {
      return true;
    }
    return false;
  }

  function isBgPixel(r: number, g: number, b: number, a: number) {
    return isChromaKey(r, g, b, a) || isDesaturatedBg(r, g, b);
  }

  const queue: number[] = [];
  const seeds: Array<{ r: number; g: number; b: number }> = [];

  const considerEdge = (x: number, y: number) => {
    const p = idx(x, y);
    if (visited[p]) return;
    const i = p * 4;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];
    if (!isBgPixel(r, g, b, a)) return;
    visited[p] = 1;
    queue.push(p);
    seeds.push({ r, g, b });
  };

  for (let x = 0; x < w; x++) {
    considerEdge(x, 0);
    considerEdge(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    considerEdge(0, y);
    considerEdge(w - 1, y);
  }

  const matchesBg = (r: number, g: number, b: number, a: number) => {
    if (isChromaKey(r, g, b, a)) return true;
    if (!isBgPixel(r, g, b, a)) return false;
    for (const s of seeds) {
      if (colorDist(r, g, b, s.r, s.g, s.b) <= 38) return true;
    }
    return seeds.length === 0;
  };

  while (queue.length) {
    const p = queue.pop()!;
    const x = p % w;
    const y = (p / w) | 0;
    out[p * 4 + 3] = 0;

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const np = idx(nx, ny);
      if (visited[np]) continue;
      const ni = np * 4;
      if (!matchesBg(out[ni], out[ni + 1], out[ni + 2], out[ni + 3])) continue;
      visited[np] = 1;
      queue.push(np);
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

export async function cleanPetSprite(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);

  // 1) Chroma key magenta/green only — never delete dark body pixels
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (isMagenta(r, g, b) || isScreenGreen(r, g, b)) {
      out[i + 3] = 0;
      continue;
    }
    // Only pure white as optional leftover studio fill (not light gray fur)
    if (isNearWhite(r, g, b)) {
      out[i + 3] = 0;
    }
  }

  // 2) Binary alpha — kill semi-transparent mush from remove_bg
  for (let i = 0; i < out.length; i += 4) {
    out[i + 3] = out[i + 3] >= 128 ? 255 : 0;
  }

  // 3) Restore dark body: if a transparent pixel is surrounded by opaque dark
  //    neighbors, it was likely over-deleted fur — fill with neighbor color.
  const copy = Buffer.from(out);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const { i, a } = px(out, w, x, y);
      if (a !== 0) continue;

      let opaqueDark = 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const n = px(copy, w, x + dx, y + dy);
        if (n.a < 128) continue;
        const lum = 0.2126 * n.r + 0.7152 * n.g + 0.0722 * n.b;
        if (lum < 140) {
          opaqueDark++;
          sr += n.r;
          sg += n.g;
          sb += n.b;
        }
      }
      if (opaqueDark >= 3) {
        out[i] = Math.round(sr / opaqueDark);
        out[i + 1] = Math.round(sg / opaqueDark);
        out[i + 2] = Math.round(sb / opaqueDark);
        out[i + 3] = 255;
      }
    }
  }

  // 4) Strip white/bright halo only when touching transparency (flash frames)
  const afterFill = Buffer.from(out);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const { i, r, g, b, a } = px(afterFill, w, x, y);
      if (a < 128) continue;
      if (!isBrightHalo(r, g, b) && !isNearWhite(r, g, b)) continue;

      let touchesClear = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          touchesClear = true;
          break;
        }
        if (px(afterFill, w, nx, ny).a < 128) {
          touchesClear = true;
          break;
        }
      }
      if (touchesClear) {
        out[i + 3] = 0;
      }
    }
  }

  // 5) Final binary alpha
  for (let i = 0; i < out.length; i += 4) {
    out[i + 3] = out[i + 3] >= 128 ? 255 : 0;
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()
    .then((b) => Buffer.from(b));
}

/** Shift pixels vertically inside the same canvas (no sharp extract — avoids bad extract area). */
async function shiftSpriteY(png: Buffer, dy: number): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const src = Buffer.from(data);
  const out = Buffer.alloc(w * h * 4, 0);

  for (let y = 0; y < h; y++) {
    const ny = y + dy;
    if (ny < 0 || ny >= h) continue;
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = (ny * w + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()
    .then((b) => Buffer.from(b));
}

/** Subtle bob without regenerating pixels (avoids AI idle white flash). */
export async function makeLocalIdleFrames(
  spritePng: Buffer,
): Promise<Buffer[]> {
  const base = await cleanPetSprite(spritePng);
  const up = await shiftSpriteY(base, -2);
  const down = await shiftSpriteY(base, 2);

  return [
    base,
    await cleanPetSprite(up),
    await cleanPetSprite(down),
  ];
}

export type EmotionFrames = {
  blink: Buffer[];
  sad: Buffer[];
  sleeping: Buffer[];
};

/** Happy = idle bob (separate). This builds blink / sad / sleep expressions. */
export async function makeEmotionFrames(
  spritePng: Buffer,
): Promise<EmotionFrames> {
  const cleaned = await cleanPetSprite(spritePng);

  const { data, info } = await sharp(cleaned)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = Buffer.from(data);
  const ww = info.width;
  const hh = info.height;

  const eyeY = Math.min(hh - 1, Math.max(0, Math.floor(hh * 0.36)));
  const mouthY = Math.min(hh - 1, Math.max(0, Math.floor(hh * 0.52)));
  const cx = Math.floor(ww / 2);
  const ink = { r: 20, g: 16, b: 14 };

  function darkenBody(src: Buffer, amount: number): Buffer {
    const out = Buffer.from(src);
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] < 128) continue;
      out[i] = Math.max(0, Math.round(out[i] * amount));
      out[i + 1] = Math.max(0, Math.round(out[i + 1] * amount));
      out[i + 2] = Math.max(0, Math.round(out[i + 2] * amount));
      out[i + 3] = 255;
    }
    return out;
  }

  function paintLids(out: Buffer, y = eyeY) {
    for (const ex of [cx - Math.floor(ww * 0.16), cx + Math.floor(ww * 0.16)]) {
      for (const dx of [-2, -1, 0, 1, 2]) {
        const x = ex + dx;
        if (x < 0 || x >= ww) continue;
        const i = (y * ww + x) * 4;
        if (out[i + 3] < 128) continue;
        out[i] = ink.r;
        out[i + 1] = ink.g;
        out[i + 2] = ink.b;
        out[i + 3] = 255;
      }
    }
  }

  /** Downturned mouth for sad. */
  function paintFrown(out: Buffer) {
    const points = [
      [cx - 3, mouthY],
      [cx - 2, mouthY + 1],
      [cx - 1, mouthY + 1],
      [cx, mouthY + 2],
      [cx + 1, mouthY + 1],
      [cx + 2, mouthY + 1],
      [cx + 3, mouthY],
    ];
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x >= ww || y >= hh) continue;
      const i = (y * ww + x) * 4;
      if (out[i + 3] < 128) continue;
      out[i] = ink.r;
      out[i + 1] = ink.g;
      out[i + 2] = ink.b;
      out[i + 3] = 255;
    }
  }

  /** Tiny upward smile for happy blink-open base (optional mouth hint). */
  function paintSmile(out: Buffer) {
    const points = [
      [cx - 2, mouthY + 1],
      [cx - 1, mouthY + 2],
      [cx, mouthY + 2],
      [cx + 1, mouthY + 2],
      [cx + 2, mouthY + 1],
    ];
    for (const [x, y] of points) {
      if (x < 0 || y < 0 || x >= ww || y >= hh) continue;
      const i = (y * ww + x) * 4;
      if (out[i + 3] < 128) continue;
      out[i] = ink.r;
      out[i + 1] = ink.g;
      out[i + 2] = ink.b;
      out[i + 3] = 255;
    }
  }

  /** Droop ear tops: shift upper side bands down 2px. */
  function droopEars(src: Buffer): Buffer {
    const out = Buffer.from(src);
    const yMax = Math.floor(hh * 0.42);
    const band = Math.max(2, Math.floor(ww * 0.22));
    // clear then copy downward for left/right bands
    for (let y = yMax; y >= 2; y--) {
      for (const side of ["L", "R"] as const) {
        const x0 = side === "L" ? 1 : ww - band - 1;
        const x1 = side === "L" ? band : ww - 2;
        for (let x = x0; x <= x1; x++) {
          const si = ((y - 2) * ww + x) * 4;
          const di = (y * ww + x) * 4;
          if (src[si + 3] < 128) continue;
          out[di] = src[si];
          out[di + 1] = src[si + 1];
          out[di + 2] = src[si + 2];
          out[di + 3] = 255;
        }
      }
    }
    return out;
  }

  async function rawToPng(buf: Buffer) {
    return sharp(buf, { raw: { width: ww, height: hh, channels: 4 } })
      .png()
      .toBuffer()
      .then((b) => Buffer.from(b));
  }

  // Blink (happy eyes close briefly)
  const blinkClosedBuf = darkenBody(raw, 1);
  paintLids(blinkClosedBuf);
  const blinkClosed = await cleanPetSprite(await rawToPng(blinkClosedBuf));

  // Sad: droop + frown + slight darken + slow bob pair
  let sadBuf = droopEars(darkenBody(raw, 0.9));
  paintFrown(sadBuf);
  // half-lids
  paintLids(sadBuf, eyeY);
  const sad0 = await cleanPetSprite(await rawToPng(sadBuf));
  const sad1 = await cleanPetSprite(await shiftSpriteY(sad0, 1));

  // Sleep: closed eyes + darker + bob
  const sleepBuf = darkenBody(raw, 0.82);
  paintLids(sleepBuf);
  const sleep0 = await cleanPetSprite(await rawToPng(sleepBuf));
  const sleep1 = await cleanPetSprite(await shiftSpriteY(sleep0, 1));

  // Keep smile helper used so happy base can stay expressive if needed later
  void paintSmile;

  return {
    blink: [cleaned, blinkClosed],
    sad: [sad0, sad1],
    sleeping: [sleep0, sleep1],
  };
}

/** @deprecated use makeEmotionFrames */
export async function makeBlinkSleepFromSprite(spritePng: Buffer) {
  const e = await makeEmotionFrames(spritePng);
  return { blink: e.blink, sleeping: e.sleeping };
}

/**
 * Fallback room poses when AI pose gen fails.
 * lie ≈ sleep expression; crouch ≈ slightly squat idle (not ideal, but usable).
 */
export async function makeLocalRoomPoses(
  spritePng: Buffer,
  sleepingFrames: Buffer[],
): Promise<{ lie: Buffer[]; crouch: Buffer[] }> {
  const base = await cleanPetSprite(spritePng);
  const lie =
    sleepingFrames.length >= 1
      ? sleepingFrames
      : [base, await shiftSpriteY(base, 1).then(cleanPetSprite)];

  // Squash vertically into canvas to suggest a crouch
  const meta = await sharp(base).metadata();
  const w = meta.width ?? 96;
  const h = meta.height ?? 96;
  const squatH = Math.max(24, Math.round(h * 0.78));
  const crouch0 = await cleanPetSprite(
    await sharp(base)
      .resize(w, squatH, {
        fit: "fill",
        kernel: sharp.kernel.nearest,
      })
      .extend({
        top: h - squatH,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
  );
  const crouch1 = await cleanPetSprite(await shiftSpriteY(crouch0, 1));

  return { lie, crouch: [crouch0, crouch1] };
}


