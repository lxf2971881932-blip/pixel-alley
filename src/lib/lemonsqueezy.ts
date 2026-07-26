/**
 * Lemon Squeezy helpers.
 *
 * - Checkout URLs are public (NEXT_PUBLIC_*) and used by the browser Overlay.
 * - `validateLicenseKey` is SERVER-ONLY — never import this function into Client Components.
 *   Call it from API routes / Route Handlers / Edge Functions only.
 */

export const LEMON_CHECKOUT_PREMIUM =
  process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PREMIUM ||
  "https://your-store.lemonsqueezy.com/checkout/buy/premium-id";

export const LEMON_CHECKOUT_CREDITS =
  process.env.NEXT_PUBLIC_LEMON_CHECKOUT_CREDITS ||
  "https://your-store.lemonsqueezy.com/checkout/buy/credits-id";

/** Append embed=1 so Lemon.js can open Overlay checkout. */
export function withLemonEmbed(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    const join = checkoutUrl.includes("?") ? "&" : "?";
    return `${checkoutUrl}${join}embed=1`;
  }
}

export type LemonLicenseValidateResult = {
  valid: boolean;
  error: string | null;
  /** Raw Lemon Squeezy `meta` / license payload when present */
  licenseKey?: {
    id?: number;
    status?: string;
    key?: string;
    activation_limit?: number | null;
    activation_usage?: number;
    created_at?: string;
    expires_at?: string | null;
  };
  meta?: Record<string, unknown>;
  raw?: unknown;
};

/**
 * Validate a Lemon Squeezy License Key (server-side).
 * Docs: https://docs.lemonsqueezy.com/api/license-api/validate-license-key
 */
export async function validateLicenseKey(
  licenseKey: string,
  options?: { instanceName?: string; signal?: AbortSignal },
): Promise<LemonLicenseValidateResult> {
  const key = String(licenseKey || "").trim();
  if (!key) {
    return { valid: false, error: "License key is required." };
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      error: "LEMON_SQUEEZY_API_KEY is not configured on the server.",
    };
  }

  const body = new URLSearchParams();
  body.set("license_key", key);
  if (options?.instanceName) {
    body.set("instance_name", options.instanceName);
  }

  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: options?.signal,
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      return {
        valid: false,
        error: `Lemon Squeezy returned a non-JSON response (${res.status}).`,
      };
    }

    if (!res.ok) {
      const errObj = data as {
        error?: string;
        errors?: Array<{ detail?: string; title?: string }>;
      };
      const msg =
        errObj.error ||
        errObj.errors?.[0]?.detail ||
        errObj.errors?.[0]?.title ||
        `License validation failed (${res.status}).`;
      return { valid: false, error: msg, raw: data };
    }

    const payload = data as {
      valid?: boolean;
      error?: string | null;
      license_key?: LemonLicenseValidateResult["licenseKey"];
      meta?: Record<string, unknown>;
    };

    return {
      valid: Boolean(payload.valid),
      error: payload.error ?? (payload.valid ? null : "License key is invalid."),
      licenseKey: payload.license_key,
      meta: payload.meta,
      raw: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return {
      valid: false,
      error: `Could not reach Lemon Squeezy License API: ${message}`,
    };
  }
}
