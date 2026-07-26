import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const maxDuration = 180;

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";
const DEFAULT_MODEL = "b24e16ff-06e3-43eb-8d33-4416c2d75876";

const PROMPT = [
  "16-bit pixel art, midnight lo-fi aesthetic, blue-toned color grading,",
  "a cozy retro Japanese storefront on a quiet street corner.",
  "Dark blue starry night sky with a bright full moon,",
  "vast empty night sky at the top for negative space.",
  "Cherry blossom branches framing the top corners.",
  "Glowing colorful paper lanterns hanging from the store eaves.",
  "A glowing red vintage vending machine, a blue wooden bench, posters on the wall.",
  "A person with a TV monitor for a head wearing a suit standing by a chalkboard,",
  "a girl sitting on the bench eating. Stray cats resting on the ground.",
  "Wet cobblestone street reflecting warm yellow and soft pink neon lighting,",
  "fallen sakura petals. Highly detailed, cinematic lighting,",
  "nostalgic and tranquil atmosphere.",
  "pure environment scene only, no UI, no clock, no search bar, no text overlay, no watermark",
].join(" ");

const NEGATIVE =
  "UI, HUD, interface, clock, search bar, watermark, logo, frame, border, blurry, photo, 3d render";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Dev helper: POST /api/dev/generate-midnight-bg
 * Generates wallpaper via Leonardo and writes to public/ + extension/newtab/
 * Guarded by NODE_ENV !== production OR DEV_BG_SECRET header.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.DEV_BG_SECRET?.trim();
    const header = request.headers.get("x-dev-secret");
    if (!secret || header !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const key = process.env.LEONARDO_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Missing LEONARDO_API_KEY" },
      { status: 500 },
    );
  }

  const modelId = process.env.LEONARDO_MODEL_ID?.trim() || DEFAULT_MODEL;

  try {
    const createRes = await fetch(`${LEONARDO_API}/generations`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: PROMPT,
        negative_prompt: NEGATIVE,
        modelId,
        width: 1472,
        height: 832,
        num_images: 1,
        public: false,
        enhancePrompt: false,
      }),
    });
    const createJson = (await createRes.json()) as {
      sdGenerationJob?: { generationId?: string };
      error?: string;
      errorMessage?: string;
    };
    if (!createRes.ok) {
      throw new Error(
        createJson.error ||
          createJson.errorMessage ||
          `create ${createRes.status}`,
      );
    }
    const generationId = createJson.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("No generationId");

    let imageUrl: string | null = null;
    const deadline = Date.now() + 150_000;
    while (Date.now() < deadline) {
      const pollRes = await fetch(
        `${LEONARDO_API}/generations/${generationId}`,
        {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${key}`,
          },
        },
      );
      const pollJson = (await pollRes.json()) as {
        generations_by_pk?: {
          status?: string;
          generated_images?: Array<{ url?: string }>;
        };
        error?: string;
      };
      if (!pollRes.ok) {
        throw new Error(pollJson.error || `poll ${pollRes.status}`);
      }
      const status = String(pollJson.generations_by_pk?.status || "").toUpperCase();
      const url = pollJson.generations_by_pk?.generated_images?.[0]?.url;
      if ((status === "COMPLETE" || status === "FINISHED") && url) {
        imageUrl = url;
        break;
      }
      if (status === "FAILED") throw new Error("Leonardo FAILED");
      await sleep(3000);
    }
    if (!imageUrl) throw new Error("Timed out");

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`download ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());

    const webOut = join(process.cwd(), "public", "midnight-lofi.png");
    const extOut = join(
      process.cwd(),
      "..",
      "extension",
      "newtab",
      "midnight-lofi.png",
    );
    mkdirSync(join(process.cwd(), "public"), { recursive: true });
    writeFileSync(webOut, buf);
    try {
      writeFileSync(extOut, buf);
    } catch {
      /* extension path may be missing in some deploys */
    }

    return NextResponse.json({
      ok: true,
      generationId,
      bytes: buf.length,
      webOut: "/midnight-lofi.png",
      extensionOut: "extension/newtab/midnight-lofi.png",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
