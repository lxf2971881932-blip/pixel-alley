export type ExtensionPetPayload = {
  petId: number;
  name: string | null;
  /** Cottage display size (room box width px) */
  size: number;
  cottageId: string;
  /** chrome.runtime.getURL used in extension; web may pass absolute */
  roomAsset?: string;
  poses: {
    sit: string | null;
    lie: string | null;
    crouch: string | null;
  };
  anchors: {
    sit: { x: number; bottom: number; petWidthPct: number };
    lie: { x: number; bottom: number; petWidthPct: number };
    crouch: { x: number; bottom: number; petWidthPct: number };
  };
  /** Legacy mood animations (optional; cottage mode ignores motion) */
  animations?: Record<
    string,
    { frameUrls: string[]; frameDurationMs: number; loop: boolean }
  >;
  idleToSadMinutes?: number;
  idleToSleepMinutes?: number;
};

import { COZY_DEFAULT } from "@/lib/cottage/cozy-default";

export function buildExtensionPayload(input: {
  petId: number;
  name?: string | null;
  size?: number;
  cottageId?: string;
  spriteUrl?: string | null;
  spriteMeta?: {
    poses?: { sit?: string; lie?: string; crouch?: string };
  } | null;
  animations: Array<{
    animation_type: string;
    frame_urls: unknown;
    frame_duration_ms: number;
    loop: boolean;
  }>;
}): ExtensionPetPayload {
  const byType = new Map<string, string[]>();
  for (const row of input.animations) {
    const urls = Array.isArray(row.frame_urls)
      ? (row.frame_urls as string[])
      : [];
    byType.set(row.animation_type, urls);
  }

  const sit =
    input.spriteMeta?.poses?.sit ||
    input.spriteUrl ||
    byType.get("breathing")?.[0] ||
    null;
  const lie =
    input.spriteMeta?.poses?.lie || byType.get("lie")?.[0] || sit;
  const crouch =
    input.spriteMeta?.poses?.crouch || byType.get("crouch")?.[0] || sit;

  const c = COZY_DEFAULT;
  const petW = c.petWidthPct;

  return {
    petId: input.petId,
    name: input.name ?? null,
    size: input.size ?? 220,
    cottageId: input.cottageId ?? c.id,
    roomAsset: "assets/cozy-room-empty.png",
    poses: { sit, lie, crouch },
    anchors: {
      sit: {
        x: c.anchors.rug.x,
        bottom: c.anchors.rug.bottom,
        petWidthPct: petW,
      },
      lie: {
        x: c.anchors.bed.x,
        bottom: c.anchors.bed.bottom,
        petWidthPct: petW,
      },
      crouch: {
        x: c.anchors.bowl.x,
        bottom: c.anchors.bowl.bottom,
        petWidthPct: petW,
      },
    },
  };
}

export function pingExtension(timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.source !== "pixel-pet-extension") return;
      if (event.data?.type === "PIXEL_PET_PONG") {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(true);
      }
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ source: "pixel-pet-web", type: "PIXEL_PET_PING" }, "*");
  });
}

export function syncPetToExtension(
  payload: ExtensionPetPayload,
  timeoutMs = 1500,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.source !== "pixel-pet-extension") return;
      if (event.data?.type === "PIXEL_PET_SYNC_ACK") {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(Boolean(event.data.ok));
      }
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: "pixel-pet-web", type: "PIXEL_PET_SYNC", payload },
      "*",
    );
  });
}
