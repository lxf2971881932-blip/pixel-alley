import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { jobId } = await params;
  const id = Number(jobId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("generation_jobs")
    .select("id, status, error_message, pet_id, created_at, finished_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  let pet = null;
  let poses: {
    idle: string | null;
    sit: string | null;
    lie: string | null;
    crouch: string | null;
    idleFrames: string[];
  } | null = null;

  if (job.pet_id && job.status === "success") {
    const { data } = await supabase
      .from("pets")
      .select("id, name, sprite_sheet_url, status, sprite_meta")
      .eq("id", job.pet_id)
      .maybeSingle();
    pet = data;

    const { data: anims } = await supabase
      .from("pet_animations")
      .select("animation_type, frame_urls")
      .eq("pet_id", job.pet_id);

    const byType = new Map(
      (anims ?? []).map((a) => [a.animation_type, a.frame_urls as string[]]),
    );
    const idle = pet?.sprite_sheet_url ?? null;
    const metaPoses = (
      pet?.sprite_meta as {
        poses?: { sit?: string; lie?: string; crouch?: string };
      } | null
    )?.poses;
    poses = {
      idle: idle,
      sit: metaPoses?.sit ?? idle,
      lie: byType.get("lie")?.[0] ?? metaPoses?.lie ?? idle,
      crouch: byType.get("crouch")?.[0] ?? metaPoses?.crouch ?? idle,
      idleFrames: byType.get("breathing") ?? (idle ? [idle] : []),
    };
  }

  return NextResponse.json({ job, pet, poses });
}
