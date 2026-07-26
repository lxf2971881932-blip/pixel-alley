import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GalleryActions } from "@/components/gallery/gallery-actions";
import { GetSyncCodeButton } from "@/components/extension/get-sync-code-button";
import {
  PixelPanel,
  PixelShell,
  SiteHeader,
} from "@/components/layout/site-chrome";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PixelShell>
        <SiteHeader active="gallery" />
        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <PixelPanel title="Gallery">
            <p className="text-sm font-semibold text-wood-ink">
              Configure Supabase first — see supabase/SETUP.md
            </p>
          </PixelPanel>
        </main>
      </PixelShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PixelShell>
        <SiteHeader active="gallery" />
        <main className="relative z-10 mx-auto flex max-w-lg flex-col gap-4 px-4 py-10 sm:px-6">
          <PixelPanel title="Gallery">
            <p className="mb-4 font-mono text-lg text-wood-dark">
              Upload a photo first — your pets will show up here.
            </p>
            <Link href="/upload" className={cn(buttonVariants(), "w-fit")}>
              Upload
            </Link>
          </PixelPanel>
        </main>
      </PixelShell>
    );
  }

  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, status, sprite_sheet_url, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <PixelShell>
      <SiteHeader active="gallery" />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pb-16 pt-2 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-sans text-pixel-outline text-tangerine text-xl sm:text-2xl">Gallery</h1>
          <Link href="/upload" className={cn(buttonVariants())}>
            New pet
          </Link>
        </div>

        {error && (
          <p className="text-sm font-semibold text-rose-deep">{error.message}</p>
        )}

        {!pets?.length && (
          <PixelPanel>
            <p className="text-sm font-semibold text-wood-ink">
              No pets yet.{" "}
              <Link
                href="/upload"
                className="underline decoration-2 underline-offset-2"
              >
                Upload a photo
              </Link>
              .
            </p>
          </PixelPanel>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {pets?.map((pet) => (
            <li key={pet.id} className="pixel-panel flex gap-4 p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border-[3px] border-wood-ink bg-sand">
                {pet.sprite_sheet_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.sprite_sheet_url}
                    alt=""
                    className="h-16 w-16"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="pixel-label text-white">{pet.status}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="truncate font-semibold text-wood-ink">
                    {pet.name || `Pet #${pet.id}`}
                    {pet.is_active ? (
                      <span className="ml-2 pixel-label text-wood-ink">active</span>
                    ) : null}
                  </p>
                  <p className="pixel-label text-wood-dark/60">{pet.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/pet/${pet.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Open
                  </Link>
                  {pet.status === "success" && (
                    <>
                      <GalleryActions petId={pet.id} isActive={pet.is_active} />
                      <GetSyncCodeButton petId={pet.id} petName={pet.name} />
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </PixelShell>
  );
}
