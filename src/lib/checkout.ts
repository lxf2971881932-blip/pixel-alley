/**
 * Public checkout config for Pixel Alley.
 * Premium sells on Gumroad; keep URLs overridable via env for staging.
 */

export const PREMIUM_PRICE_LABEL = "$4.99";

/** Live Gumroad product: Pixel Alley (emebsf). */
export const GUMROAD_CHECKOUT_PREMIUM =
  process.env.NEXT_PUBLIC_GUMROAD_CHECKOUT_PREMIUM ||
  "https://xaiverluke.gumroad.com/l/pixel-alley";

/** Optional credits pack — falls back to the same Premium product until a pack exists. */
export const GUMROAD_CHECKOUT_CREDITS =
  process.env.NEXT_PUBLIC_GUMROAD_CHECKOUT_CREDITS || GUMROAD_CHECKOUT_PREMIUM;

export type CheckoutKind = "premium" | "credits";

/** Open Gumroad checkout (wanted=true jumps straight into the pay form). */
export function openGumroadCheckout(productUrl: string): void {
  try {
    const url = new URL(productUrl);
    url.searchParams.set("wanted", "true");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    window.open(productUrl, "_blank", "noopener,noreferrer");
  }
}
