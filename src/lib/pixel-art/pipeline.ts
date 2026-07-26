import sharp from "sharp";
import {
  buildAnimationFrames,
  FRAME_META,
  type AnimationFrames,
} from "@/lib/pixelate";
import {
  generateMidnightPetAi,
  hasLeonardoKey,
} from "@/lib/pixel-art/leonardo";
import {
  keyChromaScreen,
  makeEmotionFrames,
  makeLocalIdleFrames,
} from "@/lib/pixel-art/sprite-clean";

export type PetBuildResult = {
  sprite: Buffer;
  frames: AnimationFrames;
  engine: "leonardo" | "local";
  model?: string;
  cost?: number;
};

/**
 * Green-screen key → transparent PNG.
 * Skips aggressive cleanPetSprite (it erased white fur + magenta neon rim).
 */
async function normalizeDisplay(png: Buffer, size = 128): Promise<Buffer> {
  const keyed = await keyChromaScreen(png);

  let trimmed = keyed;
  try {
    trimmed = await sharp(keyed)
      .ensureAlpha()
      .trim({ threshold: 0 })
      .png()
      .toBuffer();
  } catch {
    trimmed = await sharp(keyed).ensureAlpha().png().toBuffer();
  }

  return sharp(trimmed)
    .ensureAlpha()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
}

function allowLocalFallback() {
  return (process.env.PIXEL_AI_FALLBACK || "").toLowerCase() === "local";
}

async function wrapFrames(sprite: Buffer): Promise<AnimationFrames> {
  const breathing = await makeLocalIdleFrames(sprite);
  const { blink, sad, sleeping } = await makeEmotionFrames(sprite);
  return {
    breathing,
    blink,
    sad,
    sleeping,
    lie: [sprite],
    crouch: [sprite],
  };
}

/**
 * Leonardo-only path using the shared CHIBI prompts (same copy as before).
 */
export async function buildPetAssets(source: Buffer): Promise<PetBuildResult> {
  if (!hasLeonardoKey()) {
    if (allowLocalFallback()) {
      const local = await buildAnimationFrames(source);
      return { ...local, engine: "local" };
    }
    throw new Error(
      "Missing LEONARDO_API_KEY. Add it to web/.env.local (or set PIXEL_AI_FALLBACK=local).",
    );
  }

  try {
    const ai = await generateMidnightPetAi(source);
    const sprite = await normalizeDisplay(
      ai.sprite,
      FRAME_META.frameSize || 128,
    );
    return {
      sprite,
      frames: await wrapFrames(sprite),
      engine: "leonardo",
      model: ai.model,
    };
  } catch (err) {
    console.error("[pixel-art] Leonardo failed:", err);
    if (allowLocalFallback()) {
      const local = await buildAnimationFrames(source);
      return { ...local, engine: "local" };
    }
    const { mapNetworkError } = await import("@/lib/pixel-art/proxy-fetch");
    throw mapNetworkError(err);
  }
}
