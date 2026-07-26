/**
 * Generate transparent pixel-art decor stickers via Retro Diffusion.
 *
 * Usage:
 *   cd web && node --env-file=.env.local scripts/generate-decor.mjs
 *
 * Cost: ~1 API call per asset (prefer PIXEL_AI_QUALITY=plus for cheaper runs).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/decor");
const RD_API = "https://api.retrodiffusion.ai/v1/inferences";

const STYLE_BASE = [
  "cute 16-bit pixel art game sticker",
  "thick clean black 1-pixel outline",
  "limited bright saturated palette",
  "FLAT solid magenta background exactly #FF00FF only",
  "no gradients, no floor, no shadow, no text, no watermark",
  "crisp pixel edges, single centered object, transparent-ready",
].join(". ");

/** Curated decor pack for “appropriately crowded” landing scenery */
const ASSETS = [
  {
    id: "cloud",
    size: 96,
    prompt: `fluffy white blocky pixel cloud. ${STYLE_BASE}`,
  },
  {
    id: "palm",
    size: 128,
    prompt: `tall tropical coconut palm tree with green fronds and brown trunk. ${STYLE_BASE}`,
  },
  {
    id: "bubble-heart",
    size: 64,
    prompt: `round white speech bubble with a red pixel heart inside. ${STYLE_BASE}`,
  },
  {
    id: "bubble-hello",
    size: 96,
    prompt: `round cyan speech bubble with the word HELLO in bold black pixel letters. ${STYLE_BASE}`,
  },
  {
    id: "bubble-hey",
    size: 80,
    prompt: `round pink speech bubble with the word HEY in bold black pixel letters. ${STYLE_BASE}`,
  },
  {
    id: "fish",
    size: 64,
    prompt: `cute jumping orange pixel fish mid-air. ${STYLE_BASE}`,
  },
  {
    id: "popsicle",
    size: 48,
    prompt: `pink popsicle ice cream on a stick. ${STYLE_BASE}`,
  },
  {
    id: "mushroom",
    size: 48,
    prompt: `red mushroom with white spots, Mario style. ${STYLE_BASE}`,
  },
  {
    id: "watermelon",
    size: 48,
    prompt: `watermelon slice pixel food icon. ${STYLE_BASE}`,
  },
  {
    id: "sandcastle",
    size: 80,
    prompt: `small sandy beach sandcastle with flags. ${STYLE_BASE}`,
  },
  {
    id: "surfboard",
    size: 64,
    prompt: `yellow surfboard standing upright. ${STYLE_BASE}`,
  },
  {
    id: "cat",
    size: 64,
    prompt: `tiny cute chibi orange tabby cat sitting, big head stubby paws. ${STYLE_BASE}`,
  },
  {
    id: "dog",
    size: 64,
    prompt: `tiny cute chibi brown puppy sitting, big head stubby paws. ${STYLE_BASE}`,
  },
  {
    id: "duck",
    size: 64,
    prompt: `tiny cute chibi yellow duck, big head stubby feet. ${STYLE_BASE}`,
  },
  {
    id: "hamster",
    size: 56,
    prompt: `tiny cute chibi hamster sitting, round fluffy body. ${STYLE_BASE}`,
  },
  // Stardew Valley–inspired farm village pack
  {
    id: "cottage-l",
    size: 160,
    prompt: `Stardew Valley style top-down L-shaped cozy farm cottage, steep red-orange gabled roof, cream walls, dark wood trim, red door, small chimney, moss on roof, cute 16-bit RPG house sprite. ${STYLE_BASE}`,
  },
  {
    id: "cottage-small",
    size: 128,
    prompt: `Stardew Valley style small cozy farmhouse, steep brick-red roof, cream walls, red door, dark wood frame, tiny mailbox, 16-bit top-down RPG cottage. ${STYLE_BASE}`,
  },
  {
    id: "pine",
    size: 96,
    prompt: `Stardew Valley style evergreen pine tree, tiered dark green foliage, brown trunk, top-down 16-bit forest tree. ${STYLE_BASE}`,
  },
  {
    id: "bush",
    size: 64,
    prompt: `Stardew Valley style round leafy green bush, soft pixel art shrub. ${STYLE_BASE}`,
  },
  {
    id: "fence",
    size: 96,
    prompt: `Stardew Valley style low stone wall fence segment with wooden post caps, top-down pixel barrier. ${STYLE_BASE}`,
  },
  {
    id: "mailbox",
    size: 48,
    prompt: `tiny red rural mailbox on a post, Stardew Valley style pixel prop. ${STYLE_BASE}`,
  },
  {
    id: "flowers",
    size: 48,
    prompt: `small patch of white and orange wildflowers in grass, Stardew Valley style pixel flowers. ${STYLE_BASE}`,
  },
  {
    id: "crops",
    size: 64,
    prompt: `tiny vegetable garden crop patch in a grid, leafy greens, Stardew Valley farm crops. ${STYLE_BASE}`,
  },
  {
    id: "pond",
    size: 96,
    prompt: `small bright blue pond with dark stone rocky edge, Stardew Valley style water tile, top-down. ${STYLE_BASE}`,
  },
];

function promptStyle() {
  const q = (process.env.PIXEL_AI_QUALITY || "plus").toLowerCase();
  if (q === "pro") return "rd_pro__simple";
  return "rd_plus__classic";
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function chromaKeyMagenta(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const dMagenta = (r - 255) ** 2 + g ** 2 + (b - 255) ** 2;
    const isMagenta =
      dMagenta < 140 ** 2 ||
      (r > 190 && b > 160 && g < 140 && r - g > 60) ||
      (r > 220 && g < 90 && b > 90);
    const isGreenScreen = g > 180 && r < 100 && b < 100;
    if (isMagenta || isGreenScreen) {
      out[i + 3] = 0;
    } else {
      const pinkish = r > 160 && b > 140 && g < 160 && (r + b) / 2 - g > 40;
      if (pinkish) out[i + 3] = Math.min(out[i + 3], 40);
    }
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
}

async function rdRequest(payload, key) {
  const res = await fetch(RD_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RD-Token": key,
    },
    body: JSON.stringify(payload),
  });

  let data = await res.json();

  if (res.status === 202 || data.status === "accepted" || data.task_id) {
    const taskId = data.task_id;
    if (!taskId) throw new Error("No task_id");
    const url = `https://api.retrodiffusion.ai/v1/inferences/tasks/${taskId}`;
    for (let i = 0; i < 90; i++) {
      await sleep(2000);
      const poll = await fetch(url, { headers: { "X-RD-Token": key } });
      data = await poll.json();
      if (data.status === "succeeded" && data.result) return data.result;
      if (data.status === "succeeded" && data.base64_images) return data;
      if (data.status === "failed") {
        throw new Error(data.error?.message || "task failed");
      }
    }
    throw new Error("timeout");
  }

  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail || data);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  return data;
}

function firstImage(data) {
  const b64 = data.base64_images?.[0];
  if (!b64) throw new Error("no image");
  return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

async function generateOne(asset, key, style) {
  const outPath = path.join(OUT_DIR, `${asset.id}.png`);
  try {
    await fs.access(outPath);
    if (process.env.FORCE !== "1") {
      console.log(`skip  ${asset.id} (exists, FORCE=1 to overwrite)`);
      return { id: asset.id, skipped: true };
    }
  } catch {
    /* missing — generate */
  }

  console.log(`gen   ${asset.id}…`);
  const data = await rdRequest(
    {
      width: asset.size,
      height: asset.size,
      prompt: asset.prompt,
      num_images: 1,
      remove_bg: false,
      prompt_style: style,
    },
    key,
  );

  const raw = firstImage(data);
  const png = await chromaKeyMagenta(raw);
  await fs.writeFile(outPath, png);
  console.log(
    `ok    ${asset.id}  cost=${data.balance_cost ?? "?"}  bal=${data.remaining_balance ?? "?"}`,
  );
  return { id: asset.id, cost: data.balance_cost };
}

async function main() {
  const key = process.env.RETRO_DIFFUSION_API_KEY?.trim();
  if (!key) {
    console.error("Missing RETRO_DIFFUSION_API_KEY in env");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const style = promptStyle();
  console.log(`style=${style}  out=${OUT_DIR}`);
  console.log(`assets=${ASSETS.length}`);

  const only = process.env.ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
  const list = only?.length
    ? ASSETS.filter((a) => only.includes(a.id))
    : ASSETS;

  let totalCost = 0;
  for (const asset of list) {
    try {
      const r = await generateOne(asset, key, style);
      if (r.cost) totalCost += r.cost;
      // gentle pacing between calls
      await sleep(800);
    } catch (err) {
      console.error(`fail  ${asset.id}:`, err instanceof Error ? err.message : err);
    }
  }

  // manifest for the UI
  const files = await fs.readdir(OUT_DIR);
  const pngs = files.filter((f) => f.endsWith(".png")).sort();
  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), files: pngs }, null, 2),
  );

  console.log(`done  files=${pngs.length}  approx_cost_sum=${totalCost}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
