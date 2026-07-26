import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GetSyncCodeButton } from "@/components/extension/get-sync-code-button";
import {
  PixelPanel,
  PixelShell,
  SiteHeader,
} from "@/components/layout/site-chrome";
import { RoomStage } from "@/components/room/room-stage";

export const metadata = { title: "Pet" };

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();

  const { petId: raw } = await params;
  const petId = Number(raw);
  if (!Number.isFinite(petId)) notFound();

  const supabase = await createClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, status, sprite_sheet_url, sprite_meta, created_at")
    .eq("id", petId)
    .maybeSingle();

  if (!pet) notFound();

  const { data: animations } = await supabase
    .from("pet_animations")
    .select("animation_type, frame_urls, frame_duration_ms, loop")
    .eq("pet_id", petId);

  const byType = new Map(
    (animations ?? []).map((a) => [
      a.animation_type,
      (a.frame_urls as string[]) ?? [],
    ]),
  );
  const idle = pet.sprite_sheet_url;
  const meta = pet.sprite_meta as {
    cottageId?: string;
    poses?: { lie?: string; crouch?: string };
  } | null;
  const cottageId = meta?.cottageId ?? "cozy-default";
  const lie = byType.get("lie")?.[0] ?? meta?.poses?.lie ?? idle;
  const crouch = byType.get("crouch")?.[0] ?? meta?.poses?.crouch ?? idle;

  return (
    <PixelShell>
      <SiteHeader active="gallery" />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pb-16 pt-2 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            href="/gallery"
            className="text-sm font-semibold text-wood-ink underline decoration-2 underline-offset-2"
          >
            ← Gallery
          </Link>
          <Link href="/upload" className={cn(buttonVariants({ size: "sm" }))}>
            New pet
          </Link>
        </div>

        <div>
          <h1 className="font-sans text-pixel-outline text-xl text-tangerine sm:text-2xl">
            {pet.name || `Pet #${pet.id}`}
          </h1>
          <p className="mt-2 pixel-label text-wood-ink">{pet.status}</p>
        </div>

        {pet.status === "success" && idle ? (
          <PixelPanel title="Cozy room">
            <RoomStage
              cottageId={cottageId}
              poses={{
                idle,
                lie,
                crouch,
                idleFrames: byType.get("breathing")?.length
                  ? byType.get("breathing")
                  : [idle],
              }}
              interactive
              autoLive
            />
            <p className="mt-3 font-mono text-base text-wood-dark">
              Hover for Drink / Pet / Sleep / Feed. Sleep → bed (lie pose). Feed /
              Drink → bowl (crouch pose).
            </p>
            <div className="mt-4">
              <GetSyncCodeButton
                petId={pet.id}
                petName={pet.name}
                poses={{
                  sit: idle,
                  lie,
                  crouch,
                }}
              />
            </div>
          </PixelPanel>
        ) : (
          <PixelPanel>
            <p className="text-sm font-semibold text-wood-ink">
              This pet is not ready yet.
            </p>
          </PixelPanel>
        )}
      </main>
    </PixelShell>
  );
}
