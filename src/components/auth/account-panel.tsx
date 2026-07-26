import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PixelPanel } from "@/components/layout/site-chrome";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function AccountPanel() {
  if (!isSupabaseConfigured()) {
    return (
      <PixelPanel className="w-full max-w-lg" title="Account">
        <p className="text-sm font-semibold text-wood-dark/80">
          Supabase env vars are missing. Finish step 1 in{" "}
          <code className="pixel-label">supabase/SETUP.md</code>.
        </p>
      </PixelPanel>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PixelPanel className="w-full max-w-lg" title="Not signed in">
        <p className="mb-4 text-sm font-semibold text-wood-dark/80">
          Sign in or continue as guest to manage pets across devices.
        </p>
        <div className="flex gap-2">
          <Link href="/login" className={cn(buttonVariants())}>
            Sign in
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Register
          </Link>
        </div>
      </PixelPanel>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("device_id, is_guest, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <PixelPanel className="w-full max-w-lg" title="Account">
      <p className="mb-4 text-sm font-semibold text-wood-dark/80">
        {profile?.is_guest || user.is_anonymous
          ? "Guest session — register later to keep pets forever."
          : "Signed in with email / OAuth."}
      </p>
      <dl className="mb-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4 border-b-2 border-wood-ink/20 pb-2">
          <dt className="pixel-label text-wood-ink">User ID</dt>
          <dd className="font-mono text-xs break-all">{user.id}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b-2 border-wood-ink/20 pb-2">
          <dt className="pixel-label text-wood-ink">Email</dt>
          <dd className="font-semibold">{user.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b-2 border-wood-ink/20 pb-2">
          <dt className="pixel-label text-wood-ink">Guest</dt>
          <dd className="font-semibold">
            {profile?.is_guest || user.is_anonymous ? "yes" : "no"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="pixel-label text-wood-ink">Device ID</dt>
          <dd className="font-mono text-xs break-all">
            {profile?.device_id ?? "—"}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/upload" className={cn(buttonVariants())}>
          Create pet
        </Link>
        <Link
          href="/gallery"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Gallery
        </Link>
        <SignOutButton />
      </div>
    </PixelPanel>
  );
}
