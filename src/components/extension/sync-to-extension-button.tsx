"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  buildExtensionPayload,
  pingExtension,
  syncPetToExtension,
} from "@/lib/extension-sync";

export function SyncToExtensionButton({
  petId,
  auto = false,
}: {
  petId: number;
  /** Try sync once on mount (e.g. after generate success). */
  auto?: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "checking" | "syncing" | "ok" | "no-ext" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function runSync() {
    setStatus("checking");
    setMessage(null);

    const hasExt = await pingExtension();
    if (!hasExt) {
      setStatus("no-ext");
      setMessage(
        "Extension not detected. Load the unpacked extension, then refresh this page.",
      );
      return;
    }

    setStatus("syncing");
    const supabase = createClient();

    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("id, name, sprite_sheet_url, sprite_meta")
      .eq("id", petId)
      .maybeSingle();

    if (petError || !pet) {
      setStatus("error");
      setMessage(petError?.message ?? "Pet not found");
      return;
    }

    const { data: animations, error: animError } = await supabase
      .from("pet_animations")
      .select("animation_type, frame_urls, frame_duration_ms, loop")
      .eq("pet_id", petId);

    if (animError) {
      setStatus("error");
      setMessage(animError.message);
      return;
    }

    const meta = pet.sprite_meta as {
      poses?: { sit?: string; lie?: string; crouch?: string };
      cottageId?: string;
    } | null;

    const hasPose =
      Boolean(meta?.poses?.sit || meta?.poses?.lie || meta?.poses?.crouch) ||
      Boolean(pet.sprite_sheet_url) ||
      Boolean(animations?.length);

    if (!hasPose) {
      setStatus("error");
      setMessage("No pet sprites yet — regenerate first.");
      return;
    }

    let cottageId = "cozy-default";
    try {
      const raw = window.localStorage.getItem("pixel-pet-cottage");
      if (raw) {
        const parsed = JSON.parse(raw) as { cottageId?: string; petId?: number };
        if (parsed.cottageId && parsed.petId === petId) {
          cottageId = parsed.cottageId;
        }
      }
    } catch {
      /* ignore */
    }

    const payload = buildExtensionPayload({
      petId: pet.id,
      name: pet.name,
      size: 220,
      cottageId: meta?.cottageId ?? cottageId,
      spriteUrl: pet.sprite_sheet_url,
      spriteMeta: meta,
      animations: animations ?? [],
    });

    const ok = await syncPetToExtension(payload);
    if (!ok) {
      setStatus("error");
      setMessage("Sync timed out. Refresh the page and try again.");
      return;
    }

    setStatus("ok");
    setMessage("Synced! Open any website — cottage + pet is bottom-right.");
  }

  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => {
      void runSync();
    }, 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, petId]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={status === "checking" || status === "syncing"}
        onClick={() => void runSync()}
      >
        {status === "checking" && "Detecting extension…"}
        {status === "syncing" && "Syncing…"}
        {status === "ok" && "Synced to extension"}
        {(status === "idle" || status === "no-ext" || status === "error") &&
          "Sync to extension"}
      </Button>
      {message && (
        <p
          className={
            status === "ok"
              ? "text-xs font-semibold text-wood-ink"
              : "text-xs font-semibold text-rose-deep"
          }
        >
          {message}
        </p>
      )}
      {status === "no-ext" && (
        <p className="text-xs font-semibold text-wood-dark/70">
          Chrome → Extensions → Developer mode → Load unpacked → select the{" "}
          <code className="pixel-label">extension/</code> folder, then reload this
          tab.
        </p>
      )}
    </div>
  );
}
