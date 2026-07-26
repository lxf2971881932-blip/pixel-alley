/**
 * Generate midnight-lofi new-tab wallpaper via Leonardo text-to-image.
 *
 * Usage: node --env-file=.env.local scripts/generate-midnight-bg.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const WEB_OUT = join(ROOT, "web/public/midnight-lofi.png");
const EXT_OUT = join(ROOT, "extension/newtab/midnight-lofi.png");

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";
const MODEL_ID =
  process.env.LEONARDO_MODEL_ID?.trim() ||
  "b24e16ff-06e3-43eb-8d33-4416c2d75876"; // Lightning XL

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

function key() {
  const k = process.env.LEONARDO_API_KEY?.trim();
  if (!k) throw new Error("Missing LEONARDO_API_KEY");
  return k;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function createGeneration() {
  // 16:9 — Leonardo Lightning XL common size
  const res = await fetch(`${LEONARDO_API}/generations`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${key()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt: PROMPT,
      negative_prompt: NEGATIVE,
      modelId: MODEL_ID,
      width: 1472,
      height: 832,
      num_images: 1,
      public: false,
      enhancePrompt: false,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.error || json.errorMessage || JSON.stringify(json).slice(0, 400),
    );
  }
  const id = json.sdGenerationJob?.generationId;
  if (!id) throw new Error("No generationId in response");
  return id;
}

async function poll(generationId) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${LEONARDO_API}/generations/${generationId}`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${key()}`,
      },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `poll ${res.status}`);
    }
    const gen = json.generations_by_pk;
    const status = String(gen?.status || "").toUpperCase();
    const url = gen?.generated_images?.[0]?.url;
    if ((status === "COMPLETE" || status === "FINISHED") && url) {
      return url;
    }
    if (status === "FAILED") throw new Error("Leonardo generation FAILED");
    process.stdout.write(`… ${status || "PENDING"}\n`);
    await sleep(3000);
  }
  throw new Error("Timed out waiting for wallpaper");
}

async function main() {
  console.log("Creating Leonardo wallpaper (16:9, blue-toned midnight lofi)…");
  const id = await createGeneration();
  console.log("generationId:", id);
  const url = await poll(id);
  console.log("Downloading:", url);
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`download ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());

  mkdirSync(dirname(WEB_OUT), { recursive: true });
  mkdirSync(dirname(EXT_OUT), { recursive: true });
  writeFileSync(WEB_OUT, buf);
  writeFileSync(EXT_OUT, buf);
  console.log("Wrote", WEB_OUT);
  console.log("Wrote", EXT_OUT);
  console.log("Done. Reload the Chrome extension and open a new tab.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
