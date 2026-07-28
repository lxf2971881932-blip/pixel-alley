import sharp from "sharp";
import FormDataNode from "form-data";
import { proxyFetch } from "@/lib/pixel-art/proxy-fetch";

const LEONARDO_API_V1 = "https://cloud.leonardo.ai/api/rest/v1";
const LEONARDO_API_V2 = "https://cloud.leonardo.ai/api/rest/v2";

/**
 * Exact prompt that works on Leonardo web (Nano Banana + image reference).
 * Background is #00FF00 green screen (NOT magenta) so neon magenta rim light
 * on the pet is not destroyed by chroma-key.
 */
export const PET_SPRITE_PROMPT =
  "Key Feature Lock: Must match the animal in the reference photo or input image exactly. Preserve species characteristics—if the photo shows a dog, draw a dog; if a cat, draw a cat—never alter the species. Accurately reproduce the breed, coat color, markings, ear shape, muzzle shape, eye color, and body proportions from the photo. Do not fabricate a different pet or default to drawing a generic cat. Style: Classic 16-bit SNES-style pet pixel sprite, featuring a distinct blocky pixel aesthetic and a limited color palette. Lighting/Shading: Evoke the atmosphere of a Japanese alleyway at night—cool blue night shadows, soft magenta neon rim lighting, and warm amber lantern highlights. Pose: Seated, in a three-quarter view (turned slightly toward the viewer) to display the full body. Maintain natural, cute pet proportions; use refined dark outlines, crisp pixel edges, and flat shading. No scarves, clothing, accessories, toys, or props; no room interiors or furniture. All body pixels must be fully opaque—dark fur areas must be solid-filled with no gaps. Background: Solid bright green chroma-key screen exactly #00FF00 only—no ground, no cast shadows, no scenery, no magenta fill. No text, watermarks, or white halos; avoid realistic, 3D, or voxel styles; the pet should have a smiling expression.";

/** @deprecated alias — prefer PET_SPRITE_PROMPT */
export const MIDNIGHT_LOFI_PROMPT = PET_SPRITE_PROMPT;
export const MIDNIGHT_LOFI_NEGATIVE = "";

/** Nano Banana (web UI name) → API model string */
const NANO_BANANA = "gemini-2.5-flash-image";

export function hasLeonardoKey(): boolean {
  return Boolean(process.env.LEONARDO_API_KEY?.trim());
}

function apiKey(): string {
  const key = process.env.LEONARDO_API_KEY?.trim();
  if (!key) throw new Error("Missing LEONARDO_API_KEY");
  return key;
}

/**
 * Resolve Leonardo model.
 * Default = Nano Banana (same as successful web generations).
 * LEONARDO_MODEL_ID=auto|nano-banana → gemini-2.5-flash-image
 */
function resolveNanoModel(): string {
  const raw = (process.env.LEONARDO_MODEL_ID || "nano-banana").trim().toLowerCase();
  if (!raw || raw === "auto" || raw === "nano-banana" || raw === "nano_banana") {
    return NANO_BANANA;
  }
  if (raw === "nano-banana-pro" || raw === "nano_banana_pro") {
    return "gemini-image-2";
  }
  if (raw === "nano-banana-2" || raw === "nano_banana_2") {
    return "nano-banana-2";
  }
  return process.env.LEONARDO_MODEL_ID!.trim();
}

function imageRefStrength(): "LOW" | "MID" | "HIGH" {
  const raw = (process.env.LEONARDO_IMAGE_REF_STRENGTH || "HIGH").toUpperCase();
  if (raw === "LOW" || raw === "MID" || raw === "HIGH") return raw;
  return "HIGH";
}

function authHeaders(): HeadersInit {
  return {
    accept: "application/json",
    authorization: `Bearer ${apiKey()}`,
    "content-type": "application/json",
  };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Upload photo → Leonardo init-image id (type UPLOADED for Nano Banana guidances).
 */
export async function uploadInitImage(
  image: Buffer,
  preferredExt: "png" | "jpg" = "jpg",
): Promise<string> {
  const ext = preferredExt === "png" ? "png" : "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const bodyBytes =
    ext === "png"
      ? await sharp(image)
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .png()
          .toBuffer()
      : await sharp(image)
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();

  const createRes = await proxyFetch(`${LEONARDO_API_V1}/init-image`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ extension: ext }),
  });
  const createJson = (await createRes.json()) as {
    uploadInitImage?: {
      id?: string;
      url?: string;
      fields?: string | Record<string, string>;
    };
    error?: string;
    errorMessage?: string;
  };

  if (!createRes.ok) {
    throw new Error(
      createJson.error ||
        createJson.errorMessage ||
        `Leonardo init-image failed (${createRes.status})`,
    );
  }

  const upload = createJson.uploadInitImage;
  const id = upload?.id;
  const url = upload?.url;
  if (!id || !url) {
    throw new Error("Leonardo init-image response missing id/url");
  }

  let fields: Record<string, string> = {};
  if (typeof upload.fields === "string") {
    fields = JSON.parse(upload.fields) as Record<string, string>;
  } else if (upload.fields && typeof upload.fields === "object") {
    fields = upload.fields;
  }

  const form = new FormDataNode();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  const fileContentType = fields["Content-Type"] || mime;
  form.append("file", bodyBytes, {
    filename: `init.${ext}`,
    contentType: fileContentType,
    knownLength: bodyBytes.length,
  });

  const putRes = await proxyFetch(url, {
    method: "POST",
    headers: {
      ...form.getHeaders(),
      "Content-Length": String(form.getLengthSync()),
    },
    body: form.getBuffer(),
  });
  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    throw new Error(
      `Leonardo S3 upload failed (${putRes.status}): ${text.slice(0, 200)}`,
    );
  }

  return id;
}

type GenerationStatus = {
  generations_by_pk?: {
    id?: string;
    status?: string;
    generated_images?: Array<{ url?: string; id?: string }>;
  };
  generate?: {
    status?: string;
    generated_images?: Array<{ url?: string; id?: string }>;
  };
};

async function pollGeneration(generationId: string): Promise<Buffer> {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    // v1 get-single works for jobs created via v2 as well in practice
    const res = await proxyFetch(
      `${LEONARDO_API_V1}/generations/${generationId}`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${apiKey()}`,
        },
      },
    );
    const json = (await res.json()) as GenerationStatus & {
      error?: string;
      errorMessage?: string;
    };
    if (!res.ok) {
      throw new Error(
        json.error ||
          json.errorMessage ||
          `Leonardo poll failed (${res.status})`,
      );
    }

    const gen = json.generations_by_pk ?? json.generate;
    const status = String(gen?.status || "").toUpperCase();
    const images = gen?.generated_images ?? [];

    if (status === "COMPLETE" || status === "FINISHED") {
      const url = images[0]?.url;
      if (!url) throw new Error("Leonardo generation completed with no image");
      const imgRes = await proxyFetch(url);
      if (!imgRes.ok) throw new Error("Failed to download Leonardo image");
      const bytes = Buffer.from(new Uint8Array(await imgRes.arrayBuffer()));
      if (
        bytes.length < 8 ||
        // PNG or JPEG (Leonardo may return either depending on model)
        !(
          (bytes[0] === 0x89 && bytes[1] === 0x50) ||
          (bytes[0] === 0xff && bytes[1] === 0xd8)
        )
      ) {
        throw new Error(
          `Leonardo returned non-image bytes (header=${bytes.subarray(0, 4).toString("hex")})`,
        );
      }
      return bytes;
    }

    if (status === "FAILED") {
      throw new Error("Leonardo generation failed");
    }

    await sleep(3000);
  }
  throw new Error("Leonardo generation timed out");
}

function extractGenerationId(json: Record<string, unknown>): string | null {
  const job = json.sdGenerationJob as { generationId?: string } | undefined;
  if (job?.generationId) return job.generationId;
  const genJob = json.generationJob as { generationId?: string } | undefined;
  if (genJob?.generationId) return genJob.generationId;
  if (typeof json.generationId === "string") return json.generationId;
  const nested = json.generate as { generationId?: string } | undefined;
  if (nested?.generationId) return nested.generationId;
  return null;
}

/**
 * Match Leonardo web: Nano Banana (v2) + uploaded image_reference + web prompt.
 */
export async function generateMidnightPetAi(source: Buffer): Promise<{
  sprite: Buffer;
  model: string;
  generationId: string;
}> {
  const uploadedId = await uploadInitImage(source, "jpg");
  const model = resolveNanoModel();
  const strength = imageRefStrength();

  const createRes = await proxyFetch(`${LEONARDO_API_V2}/generations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      public: false,
      parameters: {
        width: 1024,
        height: 1024,
        prompt: PET_SPRITE_PROMPT,
        quantity: 1,
        prompt_enhance: "OFF",
        guidances: {
          image_reference: [
            {
              image: { id: uploadedId, type: "UPLOADED" },
              strength,
            },
          ],
        },
      },
    }),
  });

  const createJson = (await createRes.json()) as Record<string, unknown> & {
    error?: string;
    errorMessage?: string;
  };

  if (!createRes.ok) {
    throw new Error(
      createJson.error ||
        createJson.errorMessage ||
        `Leonardo v2 generations failed (${createRes.status}): ${JSON.stringify(createJson).slice(0, 300)}`,
    );
  }

  const generationId = extractGenerationId(createJson);
  if (!generationId) {
    throw new Error(
      `Leonardo v2 response missing generationId: ${JSON.stringify(createJson).slice(0, 300)}`,
    );
  }

  const sprite = await pollGeneration(generationId);
  return { sprite, model, generationId };
}

export async function generateDemoAlleyPetAi(promptExtra = ""): Promise<{
  sprite: Buffer;
  model: string;
  generationId: string;
}> {
  const model = resolveNanoModel();
  const prompt = [PET_SPRITE_PROMPT, promptExtra].filter(Boolean).join(" ");

  const createRes = await proxyFetch(`${LEONARDO_API_V2}/generations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      public: false,
      parameters: {
        width: 1024,
        height: 1024,
        prompt,
        quantity: 1,
        prompt_enhance: "OFF",
      },
    }),
  });

  const createJson = (await createRes.json()) as Record<string, unknown> & {
    error?: string;
    errorMessage?: string;
  };

  if (!createRes.ok) {
    throw new Error(
      createJson.error ||
        createJson.errorMessage ||
        `Leonardo v2 generations failed (${createRes.status})`,
    );
  }

  const generationId = extractGenerationId(createJson);
  if (!generationId) {
    throw new Error("Leonardo v2 response missing generationId");
  }

  const sprite = await pollGeneration(generationId);
  return { sprite, model, generationId };
}
