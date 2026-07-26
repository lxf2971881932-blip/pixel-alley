"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PixelPanel } from "@/components/layout/site-chrome";

type Mode = "login" | "register";

export function AuthForm({
  mode,
  configured,
}: {
  mode: Mode;
  configured: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function withClient(
    run: (supabase: ReturnType<typeof createClient>) => Promise<void>,
  ) {
    setError(null);
    setMessage(null);
    if (!configured) {
      setError("Supabase is not configured. See supabase/SETUP.md");
      return;
    }
    setPending(true);
    try {
      await run(createClient());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await withClient(async (supabase) => {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.push("/account");
        router.refresh();
        return;
      }

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (authError) throw authError;
      setMessage(
        "Account created. If email confirmation is on, check your inbox.",
      );
      router.refresh();
    });
  }

  async function continueAsGuest() {
    await withClient(async (supabase) => {
      const deviceId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `guest-${Date.now()}`;

      const { error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            device_id: deviceId,
            is_guest: true,
          },
        },
      });
      if (authError) throw authError;
      router.push("/upload");
      router.refresh();
    });
  }

  async function signInWithGoogle() {
    await withClient(async (supabase) => {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (authError) throw authError;
    });
  }

  const title = mode === "login" ? "Sign in" : "Create account";
  const alt =
    mode === "login"
      ? { href: "/register", label: "Need an account? Register" }
      : { href: "/login", label: "Already have an account? Sign in" };

  return (
    <PixelPanel className="w-full max-w-md" title={title}>
      <p className="mb-4 text-sm font-semibold text-wood-dark/80">
        Guest mode works without email. Google is optional after you enable it
        in Supabase.
      </p>

      {!configured && (
        <p className="mb-4 border-[3px] border-wood-ink bg-honey px-3 py-2 text-sm font-semibold text-wood-ink">
          Missing env vars — copy{" "}
          <code className="pixel-label">web/.env.local.example</code> and follow
          setup.
        </p>
      )}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="pixel-label text-wood-ink">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured || pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="pixel-label text-wood-ink">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured || pending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={!configured || pending}>
          {pending ? "Loading…" : mode === "login" ? "Enter" : "Create"}
        </Button>
      </form>

      <p className="pixel-label my-4 text-center text-wood-dark/60">or</p>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!configured || pending}
          onClick={signInWithGoogle}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!configured || pending}
          onClick={continueAsGuest}
        >
          Continue as guest
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-rose-deep" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 text-sm font-semibold text-wood-ink" role="status">
          {message}
        </p>
      )}

      <Link
        href={alt.href}
        className="mt-4 inline-block text-sm font-semibold text-wood-ink underline decoration-2 underline-offset-2"
      >
        {alt.label}
      </Link>
    </PixelPanel>
  );
}
