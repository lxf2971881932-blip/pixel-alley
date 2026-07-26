/**
 * System cottage: cozy-default
 * Anchors are % of the room image box (left/top of pet footprint center-bottom).
 * petWidth is % of room width — keep small so the pet fits furniture.
 */

export type CottageAnchorId = "rug" | "bed" | "bowl" | "pathA" | "pathB" | "pathC";

export type CottageAnchor = {
  id: CottageAnchorId;
  /** Pose shown when pet arrives here */
  pose: "idle" | "lie" | "crouch";
  /** 0–100, horizontal center of pet */
  x: number;
  /** 0–100, vertical — higher = lower on screen (CSS bottom %) */
  bottom: number;
  /** z-index hint (higher = closer to camera) */
  z: number;
};

export type CottageDef = {
  id: string;
  name: string;
  roomSrc: string;
  /** Empty room (no baked-in animals) for create/upload preview */
  roomSrcEmpty?: string;
  /** Pet width as % of room width */
  petWidthPct: number;
  anchors: Record<CottageAnchorId, CottageAnchor>;
  /** Idle roam order on the floor */
  roamPath: CottageAnchorId[];
};

export const COZY_DEFAULT: CottageDef = {
  id: "cozy-default",
  name: "Midnight Pixel Alley",
  roomSrc: "/midnight-lofi.png",
  roomSrcEmpty: "/midnight-lofi.png",
  petWidthPct: 14,
  anchors: {
    // Center rug — standing / walking
    rug: { id: "rug", pose: "idle", x: 48, bottom: 26, z: 20 },
    pathA: { id: "pathA", pose: "idle", x: 38, bottom: 30, z: 22 },
    pathB: { id: "pathB", pose: "idle", x: 56, bottom: 24, z: 18 },
    pathC: { id: "pathC", pose: "idle", x: 44, bottom: 34, z: 24 },
    // Pet bed (bottom-left) — lying pose
    bed: { id: "bed", pose: "lie", x: 22, bottom: 14, z: 28 },
    // Blue bowl by fridge — crouch pose (no eat animation)
    bowl: { id: "bowl", pose: "crouch", x: 30, bottom: 40, z: 16 },
  },
  roamPath: ["rug", "pathA", "pathC", "pathB", "rug"],
};

export const COTTAGES: Record<string, CottageDef> = {
  [COZY_DEFAULT.id]: COZY_DEFAULT,
};

export function getCottage(id = "cozy-default"): CottageDef {
  return COTTAGES[id] ?? COZY_DEFAULT;
}
