import sharp from "sharp";
import { proxyFetch } from "@/lib/pixel-art/proxy-fetch";

const RD_API = "https://api.retrodiffusion.ai/v1/inferences";

export type AiQuality = "pro" | "plus" | "off";

export function getAiQuality(): AiQuality {
  const raw = (process.env.PIXEL_AI_QUALITY || "pro").toLowerCase();
  if (raw === "off" || raw === "local" || raw === "false") return "off";
  if (raw === "plus") return "plus";
  return "pro";
}

export function hasRetroDiffusionKey() {
  return Boolean(process.env.RETRO_DIFFUSION_API_KEY?.trim());
}

/**
 * Target look: 16-bit alley companion — chunky pixels, cool night palette, neon rim.
 * Identity MUST follow the uploaded photo (dog→dog, cat→cat). Never invent another species.
 * Magenta screen for safe chroma-key (never RD remove_bg on dark fur).
 */
export const CHIBI_PROMPT = [
  "CRITICAL IDENTITY LOCK:",
  "pixel-art of the EXACT same animal in the reference photo / input image",
  "keep the SAME species — if the photo is a dog it MUST be a dog, if a cat then a cat — NEVER swap species",
  "match breed, fur color, markings, ear shape, snout or muzzle shape, eye color, and body proportions from the photo",
  "do not invent a different pet, do not default to a generic cat",
  "STYLE:",
  "classic 16-bit SNES pixel-art pet sprite, chunky visible square pixels, limited palette",
  "midnight Japanese lo-fi alley lighting: cool blue night shading, soft magenta neon rim light, warm lantern amber accents",
  "SITTING pose, body facing slightly three-quarter toward viewer, full body visible",
  "natural cute pet proportions, thin dark outline, crisp hard pixel edges, flat shading",
  "NO scarf, NO clothes, NO accessories, NO toys, NO props, NO room, NO furniture",
  "EVERY body pixel fully opaque — dark fur solid, never hollow holes",
  "FLAT solid magenta background exactly #FF00FF only — no floor no shadow no scenery",
  "no text, no watermark, no white halo, no photorealism, no 3d, no voxel",
].join(". ");

export const CHIBI_NEGATIVE = [
  "wrong species",
  "cat instead of dog",
  "dog instead of cat",
  "species swap",
  "generic mascot cat",
  "different animal than the photo",
  "photorealistic",
  "3d",
  "voxel",
  "room background",
  "furniture",
].join(", ");

const STYLE_LOCK = [
  "SAME animal as the reference — identical species colors markings face and body shape",
  "NEVER change species",
  "16-bit SNES pixel pet, chunky pixels, midnight lo-fi neon rim lighting",
  "NO scarf NO clothes NO accessories NO props",
  "EVERY body pixel opaque, dark fur filled solid",
  "FLAT solid magenta background exactly #FF00FF only",
  "no furniture no floor no text no watermark",
].join(". ");

const POSE_PROMPTS: Record<"lie" | "crouch" | "sit", string> = {
  sit: [
    "STRICT sprite rules:",
    STYLE_LOCK,
    "SITTING upright on haunches, front paws planted, facing slightly three-quarter",
    "calm cute resting sit like a street companion pet",
  ].join(". "),
  lie: [
    "STRICT sprite rules:",
    STYLE_LOCK,
    "LYING DOWN curled asleep on its side",
    "eyes closed thin lines, paws tucked, horizontal resting body",
  ].join(". "),
  crouch: [
    "STRICT sprite rules:",
    STYLE_LOCK,
    "SIDE VIEW crouching low, facing left",
    "haunches down, head slightly forward",
    "profile/side three-quarter, not front-facing",
  ].join(". "),
};

type RdResponse = {
  base64_images?: string[];
  balance_cost?: number;
  remaining_balance?: number;
  credit_cost?: number;
  model?: string;
  detail?:
    | { code?: string; message?: string }
    | string
    | Array<{ msg?: string; message?: string }>;
  status?: string;
  task_id?: string;
  result?: RdResponse;
  error?: { message?: string };
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function extractErrorMessage(data: RdResponse, status: number): string {
  const d = data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d.map((x) => x.msg || x.message || JSON.stringify(x)).join("; ");
  }
  if (d && typeof d === "object" && (d.message || d.code)) {
    return [d.code, d.message].filter(Boolean).join(": ");
  }
  if (data.error?.message) return data.error.message;
  return `Retro Diffusion HTTP ${status}`;
}

async function toRgbPngBase64(input: Buffer): Promise<string> {
  // RD img2img wants RGB PNG base64 (no data: prefix, no alpha)
  const png = await sharp(input)
    .rotate()
    .resize(256, 256, { fit: "cover", position: "attention" })
    .removeAlpha()
    .png()
    .toBuffer();
  return png.toString("base64");
}

function img2imgStrength(): number {
  // Lower = closer to the photo identity; higher = more free pixel stylization
  const n = Number(process.env.RD_IMG2IMG_STRENGTH || "0.55");
  if (!Number.isFinite(n)) return 0.55;
  return Math.min(0.85, Math.max(0.35, n));
}

async function rdRequest(
  payload: Record<string, unknown>,
): Promise<RdResponse> {
  const key = process.env.RETRO_DIFFUSION_API_KEY?.trim();
  if (!key) throw new Error("Missing RETRO_DIFFUSION_API_KEY");

  const res = await proxyFetch(RD_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RD-Token": key,
    },
    body: JSON.stringify(payload),
  });

  let data: RdResponse;
  try {
    data = (await res.json()) as RdResponse;
  } catch {
    throw new Error(`Retro Diffusion returned non-JSON (HTTP ${res.status})`);
  }

  if (res.status === 202 || data.status === "accepted" || data.task_id) {
    const taskId = data.task_id;
    if (!taskId) {
      throw new Error("Retro Diffusion accepted job but returned no task_id");
    }
    return pollTask(taskId, key);
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, res.status));
  }

  if (!data.base64_images?.length) {
    throw new Error(
      extractErrorMessage(data, res.status) ||
        "Retro Diffusion returned no images",
    );
  }

  return data;
}

async function pollTask(taskId: string, key: string): Promise<RdResponse> {
  const url = `https://api.retrodiffusion.ai/v1/inferences/tasks/${taskId}`;
  for (let i = 0; i < 90; i++) {
    await sleep(2000);
    const res = await proxyFetch(url, { headers: { "X-RD-Token": key } });
    const data = (await res.json()) as RdResponse;
    if (data.status === "succeeded" && data.result) return data.result;
    if (data.status === "succeeded" && data.base64_images) return data;
    if (data.status === "failed") {
      throw new Error(
        data.error?.message ||
          extractErrorMessage(data, res.status) ||
          "Retro Diffusion task failed",
      );
    }
  }
  throw new Error("Retro Diffusion timed out");
}

function firstImageBuffer(data: RdResponse): Buffer {
  const b64 = data.base64_images?.[0];
  if (!b64) throw new Error("Retro Diffusion returned no images");
  const clean = b64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(clean, "base64");
}

/**
 * Generate midnight-alley pixel pet locked to the uploaded photo.
 * Uses input_image img2img + reference_images so species/colors follow the pet.
 */
export async function generateChibiSpriteAi(
  photo: Buffer,
): Promise<{ sprite: Buffer; cost?: number; model: string }> {
  const quality = getAiQuality();
  if (quality === "off") {
    throw new Error("PIXEL_AI_QUALITY=off");
  }

  const photoB64 = await toRgbPngBase64(photo);
  const strength = img2imgStrength();
  const { cleanPetSprite, removeSolidBackground } = await import(
    "@/lib/pixel-art/sprite-clean"
  );

  const basePayload = {
    width: 128,
    height: 128,
    prompt: CHIBI_PROMPT,
    negative_prompt: CHIBI_NEGATIVE,
    num_images: 1,
    remove_bg: false,
    // Strong identity lock: img2img from the user photo
    input_image: photoB64,
    strength,
    // RD Pro also uses reference_images for character consistency
    reference_images: [photoB64],
  };

  // Prefer Pro styles that support reference_images for likeness
  const attempts: Array<Record<string, unknown>> =
    quality === "plus"
      ? [
          { ...basePayload, prompt_style: "rd_plus__classic" },
          { ...basePayload, prompt_style: "rd_plus__cartoon" },
        ]
      : [
          { ...basePayload, prompt_style: "rd_pro__default" },
          { ...basePayload, prompt_style: "rd_pro__simple" },
        ];

  let lastError: Error | null = null;
  let data: RdResponse | null = null;

  for (const payload of attempts) {
    try {
      data = await rdRequest(payload);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        "[retro-diffusion] attempt failed:",
        payload.prompt_style,
        lastError.message,
      );
    }
  }

  // Fallback: reference_images only (some styles reject input_image)
  if (!data) {
    for (const style of quality === "plus"
      ? ["rd_plus__classic", "rd_plus__cartoon"]
      : ["rd_pro__default", "rd_pro__simple"]) {
      try {
        data = await rdRequest({
          width: 128,
          height: 128,
          prompt: CHIBI_PROMPT,
          negative_prompt: CHIBI_NEGATIVE,
          num_images: 1,
          remove_bg: false,
          reference_images: [photoB64],
          prompt_style: style,
        });
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error("[retro-diffusion] ref-only failed:", style, lastError.message);
      }
    }
  }

  if (!data) {
    throw lastError ?? new Error("Retro Diffusion failed");
  }

  const raw = firstImageBuffer(data);
  const keyed = await removeSolidBackground(raw);
  const sprite = await cleanPetSprite(keyed);

  return {
    sprite,
    cost: data.balance_cost,
    model: data.model || (quality === "plus" ? "rd_plus" : "rd_pro"),
  };
}

export async function generateIdleAnimationAi(
  _spritePng: Buffer,
): Promise<Buffer[] | null> {
  if ((process.env.PIXEL_AI_IDLE || "").trim() !== "1") {
    return null;
  }
  return null;
}

export async function generateRoomPoseAi(
  spritePng: Buffer,
  pose: "lie" | "crouch" | "sit",
): Promise<{ sprite: Buffer; cost?: number } | null> {
  if ((process.env.PIXEL_AI_POSES || "1").trim() === "0") {
    return null;
  }
  const quality = getAiQuality();
  if (quality === "off") return null;

  try {
    const ref = await toRgbPngBase64(spritePng);
    const { cleanPetSprite, removeSolidBackground } = await import(
      "@/lib/pixel-art/sprite-clean"
    );

    const prompt_style =
      quality === "plus" ? "rd_plus__classic" : "rd_pro__default";

    const data = await rdRequest({
      width: 128,
      height: 128,
      prompt: POSE_PROMPTS[pose],
      negative_prompt: CHIBI_NEGATIVE,
      num_images: 1,
      remove_bg: false,
      input_image: ref,
      strength: img2imgStrength(),
      reference_images: [ref],
      prompt_style,
    });

    const keyed = await removeSolidBackground(firstImageBuffer(data));
    const sprite = await cleanPetSprite(keyed);
    return { sprite, cost: data.balance_cost };
  } catch (err) {
    console.error(`[retro-diffusion] pose ${pose} failed:`, err);
    return null;
  }
}
