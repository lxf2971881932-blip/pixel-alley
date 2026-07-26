"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SyncReadyModal } from "@/components/upload/generate-modals";

/** Create / show a PET-XXXX sync code for an existing pet */
export function GetSyncCodeButton({
  petId,
  petName,
  poses,
}: {
  petId: number;
  petName?: string | null;
  poses?: {
    sit?: string | null;
    lie?: string | null;
    crouch?: string | null;
  } | null;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sync-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId, cottageId: "cozy-default" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCode(data.code);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={busy} onClick={() => void run()}>
        {busy ? "Creating code…" : "Get sync code"}
      </Button>
      {error ? (
        <p className="text-xs font-semibold text-rose-deep">{error}</p>
      ) : null}
      <SyncReadyModal
        open={open}
        syncCode={code}
        petName={petName ?? undefined}
        poses={poses}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
