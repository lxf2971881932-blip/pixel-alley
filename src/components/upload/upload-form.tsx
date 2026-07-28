"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PixelPanel } from "@/components/layout/site-chrome";
import { PixelPaw } from "@/components/hammy/pixel-icons";
import {
  GeneratingModal,
  SyncReadyModal,
} from "@/components/upload/generate-modals";
import {
  GUMROAD_CHECKOUT_CREDITS,
  GUMROAD_CHECKOUT_PREMIUM,
  PREMIUM_PRICE_LABEL,
  openGumroadCheckout,
  type CheckoutKind,
} from "@/lib/checkout";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png"];
const FREEMIUM_KEY = "pixel-alley-freemium";

type Phase =
  | "idle"
  | "uploading"
  | "generating"
  | "polling"
  | "success"
  | "error";

type ModalView = "none" | "waiting" | "sync";

type FreemiumState = {
  isPremium: boolean;
  generationCredits: number;
};

function CheckIcon() {
  return (
    <span
      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[#ff77a8] bg-[#ff77a8]/20 text-[10px] leading-none text-[#ff77a8]"
      aria-hidden
    >
      ✓
    </span>
  );
}

export function UploadForm({ configured }: { configured: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [claimPoses, setClaimPoses] = useState<{
    sit?: string | null;
    lie?: string | null;
    crouch?: string | null;
  } | null>(null);
  const [petId, setPetId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalView>("none");
  const [syncCode, setSyncCode] = useState<string | null>(null);

  const [isPremium, setIsPremium] = useState(false);
  const [generationCredits, setGenerationCredits] = useState(0);
  const [freemiumReady, setFreemiumReady] = useState(false);
  const [paying, setPaying] = useState<"premium" | "credits" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FREEMIUM_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FreemiumState;
        setIsPremium(Boolean(parsed.isPremium));
        setGenerationCredits(
          Number.isFinite(parsed.generationCredits)
            ? Math.max(0, Math.floor(parsed.generationCredits))
            : 0,
        );
      }
    } catch {
      /* ignore */
    }
    setFreemiumReady(true);
  }, []);

  useEffect(() => {
    if (!freemiumReady) return;
    try {
      window.localStorage.setItem(
        FREEMIUM_KEY,
        JSON.stringify({ isPremium, generationCredits } satisfies FreemiumState),
      );
    } catch {
      /* ignore */
    }
  }, [isPremium, generationCredits, freemiumReady]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function startCheckout(kind: CheckoutKind) {
    setError(null);
    setPaying(kind);
    const url =
      kind === "premium" ? GUMROAD_CHECKOUT_PREMIUM : GUMROAD_CHECKOUT_CREDITS;
    openGumroadCheckout(url);
    setToast(
      "Checkout opened on Gumroad. After paying, check your email for your receipt / access details.",
    );
    window.setTimeout(() => setPaying(null), 1200);
  }

  const onPick = useCallback((next: File | null) => {
    setError(null);
    setSpriteUrl(null);
    setClaimPoses(null);
    setPetId(null);
    setJobId(null);
    setPhase("idle");
    setModal("none");
    setSyncCode(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);

    if (!next) return;

    if (!ACCEPT.includes(next.type)) {
      setError("Only JPG or PNG images are allowed.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("File must be 10MB or smaller.");
      return;
    }

    setFile(next);
    setPreview(URL.createObjectURL(next));
  }, []);

  function applySprite(
    data: {
      poses?: {
        sit?: string | null;
        idle?: string | null;
        lie?: string | null;
        crouch?: string | null;
      };
      spriteUrl?: string;
      pet?: { sprite_sheet_url?: string | null };
    },
    fallbackSprite?: string | null,
  ) {
    const sit =
      data.poses?.sit ||
      data.poses?.idle ||
      data.spriteUrl ||
      data.pet?.sprite_sheet_url ||
      fallbackSprite ||
      null;
    if (!sit) return;
    setSpriteUrl(sit);
    setClaimPoses({
      sit,
      lie: data.poses?.lie || sit,
      crouch: data.poses?.crouch || sit,
    });
  }

  async function createSyncCode(id: number) {
    const res = await fetch("/api/sync-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId: id, cottageId: "cozy-default" }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Could not create sync code");
    }
    setSyncCode(data.code as string);
    try {
      window.localStorage.setItem(
        "pixel-pet-last-sync",
        JSON.stringify({
          code: data.code,
          petId: id,
          payload: data.payload,
          at: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  function spendCredit() {
    setGenerationCredits((c) => Math.max(0, c - 1));
  }

  async function onReady(id: number) {
    spendCredit();
    setPetId(id);
    setPhase("success");
    try {
      await createSyncCode(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} (run supabase/migration_sync_codes.sql?)`
          : "Sync code failed",
      );
    }
    setModal("sync");
  }

  async function pollJob(id: number) {
    setPhase("polling");
    for (let i = 0; i < 45; i++) {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to poll job");

      const status = data.job?.status as string;
      if (status === "success") {
        const nextPetId = (data.pet?.id ?? data.job?.pet_id) as number;
        applySprite(data, data.pet?.sprite_sheet_url);
        await onReady(nextPetId);
        return;
      }
      if (status === "failed") {
        throw new Error(data.job?.error_message ?? "Generation failed");
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    throw new Error("Timed out waiting for generation");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPremium) {
      setError("Unlock Premium to generate your alley pet.");
      return;
    }
    if (generationCredits <= 0) {
      setError("No generation credits left. Get more to continue.");
      return;
    }
    if (!configured) {
      setError("Supabase is not configured.");
      return;
    }
    if (!file) {
      setError("Choose a photo first.");
      return;
    }

    setModal("waiting");
    setSyncCode(null);

    try {
      const supabase = createClient();
      let {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const deviceId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `guest-${Date.now()}`;
        const { data: anon, error: anonError } =
          await supabase.auth.signInAnonymously({
            options: {
              data: { device_id: deviceId, is_guest: true },
            },
          });
        if (anonError) throw new Error(anonError.message);
        user = anon.user;
      }

      if (!user) {
        throw new Error("Could not start a guest session. Try refreshing.");
      }

      setPhase("uploading");
      const ext = file.type === "image/png" ? "png" : "jpg";
      const sourcePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("pet-images")
        .upload(sourcePath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      setPhase("generating");
      const res = await fetch("/api/pets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.jobId) {
          setJobId(data.jobId);
          await pollJob(data.jobId);
          return;
        }
        throw new Error(data.error ?? "Generation request failed");
      }

      setJobId(data.jobId);
      if (data.status === "success" && data.spriteUrl) {
        applySprite(data, data.spriteUrl);
        await onReady(data.petId as number);
        return;
      }

      await pollJob(data.jobId);
    } catch (err) {
      setPhase("error");
      setModal("none");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const busy =
    phase === "uploading" || phase === "generating" || phase === "polling";
  const outOfCredits = isPremium && generationCredits <= 0;
  const canGenerate = isPremium && generationCredits > 0 && !!file && !busy;
  /** Demo pet sells the product; swap to user sprite after a successful generate. */
  const previewPetSrc = spriteUrl || "/demo-alley-pet.png";
  const previewPetAlt = spriteUrl
    ? name.trim() || "Your pixel pet"
    : "Example midnight pixel pet";

  return (
    <>
      <GeneratingModal
        open={modal === "waiting"}
        step={
          phase === "uploading"
            ? "uploading"
            : phase === "polling"
              ? "polling"
              : "generating"
        }
      />
      <SyncReadyModal
        open={modal === "sync"}
        syncCode={syncCode}
        petName={name.trim() || undefined}
        poses={claimPoses}
        onClose={() => setModal("none")}
      />

      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border-2 border-[#ff77a8] bg-black/90 px-4 py-3 font-mono text-sm text-white shadow-[0_0_24px_rgba(255,119,168,0.55)] backdrop-blur-md"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <div className="mb-2 w-full max-w-4xl text-center lg:text-left">
        <h1 className="font-pixel neon-brand text-2xl uppercase leading-relaxed sm:text-3xl">
          Pixel Alley
        </h1>
        <p className="mt-3 font-mono text-lg leading-relaxed text-gray-300">
          {isPremium
            ? "Upload a photo of your pet and let them wait for you in the Midnight Pixel Alley."
            : "Peek into the Midnight Pixel Alley — unlock Premium to bring your own pet home."}
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <PixelPanel
          title={isPremium ? "Create your alley pet" : "Premium unlock"}
        >
          {!isPremium ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-pixel text-[11px] leading-relaxed text-[#ff77a8] sm:text-xs">
                  Bring Your Pet Home - Premium Unlock
                </h2>
                <p className="mt-3 inline-block rounded-lg border border-[#ff77a8]/50 bg-[#ff77a8]/10 px-3 py-1.5 font-pixel text-[10px] text-white shadow-[0_0_12px_rgba(255,119,168,0.25)]">
                  {PREMIUM_PRICE_LABEL} / Lifetime Access
                </p>
              </div>

              <ul className="space-y-2.5 font-mono text-base text-gray-200">
                <li className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span>Upload your own pet&apos;s photo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span>AI-generated 16-bit pixel companion</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span>Includes 3 generation credits</span>
                </li>
              </ul>

              <button
                type="button"
                disabled={paying === "premium" || !freemiumReady}
                onClick={() => startCheckout("premium")}
                className="paywall-cta w-full rounded-xl border-2 border-[#ff77a8] bg-[#ff0055]/25 px-4 py-3.5 font-pixel text-[10px] uppercase tracking-wide text-white shadow-[0_0_22px_rgba(255,119,168,0.55)] transition disabled:cursor-wait disabled:opacity-70 sm:text-[11px]"
              >
                {paying === "premium" ? "Opening checkout…" : "Unlock Premium Now"}
              </button>

              <p className="font-mono text-sm leading-relaxed text-gray-400">
                Secure checkout via Gumroad. After payment, check your email for
                your receipt and follow the product instructions to claim your
                pet.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 font-mono text-lg leading-relaxed text-gray-300">
                Upload JPG/PNG (≤10MB). We craft one midnight-lofi pixel pet, then
                give you a sync code for the Chrome new-tab alley.
              </p>

              <p className="mb-4 font-pixel text-[9px] text-[#ff77a8]">
                Credits remaining: {generationCredits}
              </p>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="photo" className="pixel-label text-white">
                    Photo
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    disabled={busy || outOfCredits}
                    onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="pixel-label text-white">
                    Name (optional)
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    maxLength={50}
                    disabled={busy || outOfCredits}
                    placeholder="Mochi"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!canGenerate}
                >
                  <span className="inline-flex items-center gap-2">
                    <PixelPaw size={16} />
                    Generate!
                  </span>
                </Button>

                {outOfCredits ? (
                  <button
                    type="button"
                    disabled={paying === "credits"}
                    onClick={() => startCheckout("credits")}
                    className="w-full text-center font-mono text-sm text-[#ff77a8] underline decoration-[#ff77a8]/50 underline-offset-4 transition hover:text-white disabled:opacity-60"
                  >
                    {paying === "credits"
                      ? "Opening checkout…"
                      : `Out of credits? Get more via Gumroad (${PREMIUM_PRICE_LABEL})`}
                  </button>
                ) : null}

                {error && (
                  <div
                    className="rounded-xl border-2 border-[#ff4d6d] bg-[#ff4d6d]/15 px-3 py-2 font-mono text-base text-white"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {phase === "success" && syncCode && (
                  <div className="border-t border-[#ff77a8]/40 pt-4">
                    <p className="font-mono text-base text-white">
                      Sync code:{" "}
                      <strong className="text-[#ff77a8]">{syncCode}</strong>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setModal("sync")}
                    >
                      Show sync code again
                    </Button>
                  </div>
                )}
              </form>
            </>
          )}
        </PixelPanel>

        <div className="space-y-3">
          <PixelPanel title="Midnight preview">
            <div className="relative overflow-hidden rounded-xl border-2 border-[#ff77a8]/60 shadow-[0_0_15px_rgba(255,119,168,0.25)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/midnight-lofi.png"
                alt="Midnight Pixel Alley"
                className="block h-auto w-full pixelated"
              />
              {/* Product demo pet — shows paying users the finished look */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPetSrc}
                alt={previewPetAlt}
                className="pointer-events-none absolute bottom-[2%] left-[46%] w-[min(12%,72px)] -translate-x-1/2 pixelated drop-shadow-[0_0_14px_rgba(255,119,168,0.85)]"
              />
              {!spriteUrl ? (
                <div className="absolute bottom-2 left-2 rounded-md border border-[#ff77a8]/70 bg-black/70 px-2 py-1 font-pixel text-[7px] uppercase text-[#ff77a8]">
                  Example pet
                </div>
              ) : (
                <div className="absolute bottom-2 left-2 rounded-md border border-[#ff77a8]/70 bg-black/70 px-2 py-1 font-pixel text-[7px] uppercase text-[#ff77a8]">
                  Your pet
                </div>
              )}
            </div>
            <p className="mt-3 text-center font-mono text-sm text-gray-400">
              {spriteUrl
                ? "Your companion is ready — sync into a new browser tab"
                : "Finished look: your photo becomes a neon pixel pet in the alley"}
            </p>
          </PixelPanel>

          {isPremium && preview ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#ff77a8] bg-black/50 px-3 py-2 shadow-[0_0_15px_rgba(255,119,168,0.2)] backdrop-blur-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected photo"
                className="h-14 w-14 rounded-lg border-2 border-[#ff77a8]/60 object-cover"
              />
              <p className="font-mono text-base text-gray-300">
                Photo selected — click Generate!
              </p>
            </div>
          ) : null}

          {isPremium && !preview ? (
            <p className="text-center font-mono text-sm text-gray-400">
              After generate, sync into a new browser tab
            </p>
          ) : null}

          {isPremium && spriteUrl && petId ? (
            <p className="text-center font-mono text-xs text-gray-500">
              Pet #{petId} ready · credits left: {generationCredits}
            </p>
          ) : null}
          {jobId ? <p className="sr-only">Job {jobId}</p> : null}
        </div>
      </div>
    </>
  );
}
