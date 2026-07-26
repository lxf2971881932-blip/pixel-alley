import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
export type SyncPetPayload = {
  petId: number;
  name: string | null;
  sceneId: string;
  sceneName: string;
  roomSrc: string;
  spriteUrl: string | null;
  /** Single static pose for midnight new-tab */
  poses: {
    sit: string | null;
  };
  /** Bottom center-right street placement (matches midnight lofi ref) */
  anchors: {
    sit: { x: number; bottom: number; petWidthPct: number };
  };
  createdAt: string;
};

function randomSyncCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `PET-${n}`;
}

function buildPayload(input: {
  petId: number;
  name: string | null;
  spriteUrl: string | null;
  poses?: { sit?: string } | null;
}): SyncPetPayload {
  const sit = input.poses?.sit || input.spriteUrl || null;

  return {
    petId: input.petId,
    name: input.name,
    sceneId: "midnight-lofi",
    sceneName: "Midnight Pixel Alley",
    roomSrc: "/midnight-lofi.png",
    spriteUrl: input.spriteUrl,
    poses: { sit },
    anchors: {
      sit: {
        // Street cobblestones — slightly above the very bottom edge
        x: 46,
        bottom: 9,
        petWidthPct: 9.5,
      },
    },
    createdAt: new Date().toISOString(),
  };
}

/** POST /api/sync-codes — create a PET-XXXX code for a owned pet */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { petId?: number; cottageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const petId = Number(body.petId);
  if (!Number.isFinite(petId) || petId <= 0) {
    return NextResponse.json({ error: "petId is required" }, { status: 400 });
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id, name, sprite_sheet_url, sprite_meta, status")
    .eq("id", petId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (petError) {
    return NextResponse.json({ error: petError.message }, { status: 500 });
  }
  if (!pet || pet.status !== "success") {
    return NextResponse.json(
      { error: "Pet not found or not ready" },
      { status: 404 },
    );
  }

  const meta = pet.sprite_meta as {
    poses?: { sit?: string; lie?: string; crouch?: string };
    cottageId?: string;
  } | null;

  const payload = buildPayload({
    petId: pet.id,
    name: pet.name,
    spriteUrl: pet.sprite_sheet_url,
    poses: meta?.poses ?? null,
  });

  const admin = createServiceClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let code: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = randomSyncCode();
    const { data, error } = await admin
      .from("pet_sync_codes")
      .insert({
        code: candidate,
        pet_id: pet.id,
        user_id: user.id,
        payload,
        expires_at: expiresAt,
      })
      .select("code")
      .maybeSingle();

    if (!error && data?.code) {
      code = data.code;
      break;
    }
    lastError = error?.message ?? "insert failed";
    // unique violation → retry
    if (error && !/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: lastError ?? "Could not allocate sync code" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    code,
    expiresAt,
    payload,
  });
}
