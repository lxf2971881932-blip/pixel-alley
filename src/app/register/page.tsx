import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PixelShell, SiteHeader } from "@/components/layout/site-chrome";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <PixelShell>
      <SiteHeader active="login" />
      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 pb-16 pt-4 sm:px-6">
        <AuthForm mode="register" configured={isSupabaseConfigured()} />
        <p className="mt-4 text-center text-sm font-semibold text-wood-ink">
          Already have a save file?{" "}
          <Link href="/login" className="underline decoration-2 underline-offset-2">
            Sign in
          </Link>
        </p>
      </main>
    </PixelShell>
  );
}
