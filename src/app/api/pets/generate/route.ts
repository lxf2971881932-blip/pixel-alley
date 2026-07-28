import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { FRAME_META } from "@/lib/pixelate";
import { buildPetAssets } from "@/lib/pixel-art/pipeline";

export const runtime = "nodejs";
export const maxDuration = 180;

type Body = {
  sourcePath: string;
  name?: string;
};

/** Avoid UTF-8 mangling of PNG bytes when Supabase Storage uploads via fetch. */
function pngBlob(buf: Buffer): Blob {
  if (
    buf.length < 8 ||
    buf[0] !== 0x89 ||
    buf[1] !== 0x50 ||
    buf[2] !== 0x4e ||
    buf[3] !== 0x47
  ) {
    throw new Error(
      `Refusing to upload non-PNG bytes (header=${buf.subarray(0, 4).toString("hex")})`,
    );
  }
  return new Blob([Uint8Array.from(buf)], { type: "image/png" });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sourcePath = body.sourcePath?.trim();
  if (!sourcePath || sourcePath.includes("..")) {
    return NextResponse.json({ error: "sourcePath is required" }, { status: 400 });
  }

  if (!sourcePath.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: "Invalid source path" }, { status: 403 });
  }

  const admin = createServiceClient();
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sourceRef = `pet-images/${sourcePath}`;

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .insert({
      user_id: userId,
      name: body.name?.slice(0, 50) || null,
      source_image_url: sourceRef,
      status: "pending",
      is_active: false,
    })
    .select("id")
    .single();

  if (petError || !pet) {
    return NextResponse.json(
      { error: petError?.message ?? "Failed to create pet" },
      { status: 500 },
    );
  }

  const petId = pet.id as number;

  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: userId,
      pet_id: petId,
      source_image_url: sourceRef,
      status: "queued",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    await supabase.from("pets").delete().eq("id", petId);
    return NextResponse.json(
      { error: jobError?.message ?? "Failed to create job" },
      { status: 500 },
    );
  }

  const jobId = job.id as number;

  try {
    await supabase
      .from("generation_jobs")
      .update({ status: "processing" })
      .eq("id", jobId);
    await supabase
      .from("pets")
      .update({ status: "processing" })
      .eq("id", petId);

    const { data: fileData, error: downloadError } = await admin.storage
      .from("pet-images")
      .download(sourcePath);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download source image");
    }

    const inputBuffer = Buffer.from(await fileData.arrayBuffer());
    const { sprite, frames, engine, model, cost } =
      await buildPetAssets(inputBuffer);

    const spritePath = `${userId}/${petId}/sprite.png`;
    const { error: spriteUploadError } = await admin.storage
      .from("pet-sprites")
      .upload(spritePath, pngBlob(sprite), {
        contentType: "image/png",
        upsert: true,
      });
    if (spriteUploadError) {
      throw new Error(spriteUploadError.message);
    }

    const spriteUrl = `${publicBase}/storage/v1/object/public/pet-sprites/${spritePath}`;

    async function uploadFrames(
      type: "breathing" | "blink" | "sad" | "sleeping",
      buffers: Buffer[],
    ) {
      const urls: string[] = [];
      for (let i = 0; i < buffers.length; i++) {
        const path = `${userId}/${petId}/${type}-${i}.png`;
        const { error } = await admin.storage
          .from("pet-sprites")
          .upload(path, pngBlob(buffers[i]), {
            contentType: "image/png",
            upsert: true,
          });
        if (error) throw new Error(error.message);
        urls.push(`${publicBase}/storage/v1/object/public/pet-sprites/${path}`);
      }
      return urls;
    }

    // Keep minimal animation rows for older clients; no multi-pose AI
    const breathingUrls = await uploadFrames("breathing", frames.breathing);
    const blinkUrls = await uploadFrames("blink", frames.blink);
    const sadUrls = await uploadFrames("sad", frames.sad);
    const sleepingUrls = await uploadFrames("sleeping", frames.sleeping);

    const coreRows = [
      {
        pet_id: petId,
        animation_type: "breathing",
        frame_urls: breathingUrls,
        frame_duration_ms: 420,
        loop: true,
      },
      {
        pet_id: petId,
        animation_type: "blink",
        frame_urls: blinkUrls,
        frame_duration_ms: 90,
        loop: false,
      },
      {
        pet_id: petId,
        animation_type: "sad",
        frame_urls: sadUrls,
        frame_duration_ms: 550,
        loop: true,
      },
      {
        pet_id: petId,
        animation_type: "sleeping",
        frame_urls: sleepingUrls,
        frame_duration_ms: 700,
        loop: true,
      },
    ];

    const { error: coreAnimError } = await admin
      .from("pet_animations")
      .upsert(coreRows, { onConflict: "pet_id,animation_type" });
    if (coreAnimError) throw new Error(coreAnimError.message);

    await admin
      .from("pets")
      .update({ is_active: false })
      .eq("user_id", userId)
      .neq("id", petId);

    const { error: petUpdateError } = await admin
      .from("pets")
      .update({
        status: "success",
        sprite_sheet_url: spriteUrl,
        sprite_meta: {
          ...FRAME_META,
          engine,
          model: model ?? null,
          aiCost: cost ?? null,
          sceneId: "midnight-lofi",
          poses: {
            sit: spriteUrl,
          },
          frames: {
            breathing: breathingUrls.length,
            blink: blinkUrls.length,
            sad: sadUrls.length,
            sleeping: sleepingUrls.length,
          },
        },
        is_active: true,
      })
      .eq("id", petId);
    if (petUpdateError) throw new Error(petUpdateError.message);

    await admin.from("user_settings").upsert({
      user_id: userId,
      active_pet_id: petId,
      updated_at: new Date().toISOString(),
    });

    await admin
      .from("generation_jobs")
      .update({
        status: "success",
        pet_id: petId,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({
      jobId,
      petId,
      status: "success",
      spriteUrl,
      poses: {
        sit: spriteUrl,
        idle: spriteUrl,
        idleFrames: breathingUrls,
      },
      engine,
      model: model ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await admin
      .from("generation_jobs")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    await admin.from("pets").update({ status: "failed" }).eq("id", petId);

    return NextResponse.json(
      { error: message, jobId, petId, status: "failed" },
      { status: 500 },
    );
  }
}
