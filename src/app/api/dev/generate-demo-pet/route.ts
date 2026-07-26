import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { generateDemoAlleyPetAi } from "@/lib/pixel-art/leonardo";
import {
  cleanPetSprite,
  removeSolidBackground,
} from "@/lib/pixel-art/sprite-clean";

export const runtime = "nodejs";
export const maxDuration = 180;

async function normalizeDemoSprite(png: Buffer): Promise<Buffer> {
  const keyed = await removeSolidBackground(png);
  const cleaned = await cleanPetSprite(keyed);
  const trimmed = await sharp(cleaned)
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
  // Chunky pixels closer to the alley wallpaper scale
  return sharp(trimmed)
    .resize(96, 96, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .resize(192, 192, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer()
    .then((b) => cleanPetSprite(b));
}

/**
 * Dev helper: POST /api/dev/generate-demo-pet
 * Leonardo text-to-image → keyed transparent PNG → web/public/demo-alley-pet.png
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.DEV_BG_SECRET?.trim();
    const header = request.headers.get("x-dev-secret");
    if (!secret || header !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      promptExtra?: string;
    };
    const ai = await generateDemoAlleyPetAi(body.promptExtra || "");
    const sprite = await normalizeDemoSprite(ai.sprite);

    const webOut = join(process.cwd(), "public", "demo-alley-pet.png");
    mkdirSync(join(process.cwd(), "public"), { recursive: true });
    writeFileSync(webOut, sprite);

    return NextResponse.json({
      ok: true,
      generationId: ai.generationId,
      model: ai.model,
      bytes: sprite.length,
      webOut: "/demo-alley-pet.png",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
