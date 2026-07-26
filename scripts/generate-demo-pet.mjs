/**
 * Generate homepage demo pet via Leonardo text-to-image + bg keying.
 *
 * Usage: node --env-file=.env.local scripts/generate-demo-pet.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_OUT = join(__dirname, "../public/demo-alley-pet.png");

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";
const MODEL_ID =
  process.env.LEONARDO_MODEL_ID?.trim() ||
  "b24e16ff-06e3-43eb-8d33-4416c2d75876";

const PROMPT = [
  "16-bit pixel art sprite, chunky visible pixels matching a midnight Japanese alley scene,",
  "cute chibi calico cat companion, same blue-night color grading and soft pink neon rim light",
  "as wet cobblestone sakura street art, warm lantern amber accents on fur edges,",
  "sitting pose, full body, facing camera slightly,",
  "pure solid pure black background only #000000, no ground, no scenery, no shadow plate,",
  "single character centered, no text, no watermark, no UI",
].join(" ");

const NEGATIVE =
  "photo, photorealistic, 3d render, smooth gradients, blurry, scenery, street, building, bench, ground plane, shadow, text, watermark, UI, multiple pets";

function key() {
  const k = process.env.LEONARDO_API_KEY?.trim();
  if (!k) throw new Error("Missing LEONARDO_API_KEY");
  return k;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function removeSolidBackground(png) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const isBg = (r, g, b, a) => {
    if (a < 16) return true;
    if (r <= 40 && g <= 40 && b <= 40) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max <= 55 && max - min <= 12;
  };
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = idx(x, y);
    if (visited[p]) return;
    const i = p * 4;
    if (!isBg(out[i], out[i + 1], out[i + 2], out[i + 3])) return;
    visited[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (queue.length) {
    const p = queue.pop();
    const x = p % w;
    const y = (p / w) | 0;
    out[p * 4 + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let i = 0; i < out.length; i += 4) {
    out[i + 3] = out[i + 3] >= 128 ? 255 : 0;
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${key()}`,
    "content-type": "application/json",
  };

  console.log("Creating Leonardo generation...");
  const createRes = await fetch(`${LEONARDO_API}/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: PROMPT,
      negative_prompt: NEGATIVE,
      modelId: MODEL_ID,
      width: 512,
      height: 512,
      num_images: 1,
      transparency: "foreground_only",
      public: false,
      enhancePrompt: false,
    }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(
      createJson.error || createJson.errorMessage || `create ${createRes.status}`,
    );
  }
  const generationId = createJson.sdGenerationJob?.generationId;
  if (!generationId) throw new Error("No generationId");
  console.log("generationId", generationId);

  let imageUrl = null;
  const deadline = Date.now() + 150_000;
  while (Date.now() < deadline) {
    const pollRes = await fetch(
      `${LEONARDO_API}/generations/${generationId}`,
      { headers: { accept: "application/json", authorization: headers.authorization } },
    );
    const pollJson = await pollRes.json();
    const status = String(pollJson.generations_by_pk?.status || "").toUpperCase();
    const url = pollJson.generations_by_pk?.generated_images?.[0]?.url;
    console.log("status", status);
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
  const raw = Buffer.from(await imgRes.arrayBuffer());
  const keyed = await removeSolidBackground(raw);
  const final = await sharp(keyed)
    .trim({ threshold: 8 })
    .resize(96, 96, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .resize(192, 192, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  mkdirSync(dirname(WEB_OUT), { recursive: true });
  writeFileSync(WEB_OUT, final);
  console.log("Wrote", WEB_OUT, final.length, "bytes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
