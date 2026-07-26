import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Node fetch ignores system VPN. Point Leonardo traffic at a local HTTP proxy.
 *
 * Prefer PIXEL_HTTPS_PROXY (always loaded by Next from .env.local).
 * Falls back to HTTPS_PROXY / HTTP_PROXY.
 *
 * Example in web/.env.local:
 *   PIXEL_HTTPS_PROXY=http://127.0.0.1:7897
 */
function proxyUrl(): string {
  return (
    process.env.PIXEL_HTTPS_PROXY?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.ALL_PROXY?.trim() ||
    ""
  );
}

let cachedUrl = "";
let cachedAgent: ProxyAgent | null = null;

function getAgent(): ProxyAgent | null {
  const url = proxyUrl();
  if (!url) return null;
  if (cachedAgent && cachedUrl === url) return cachedAgent;
  cachedUrl = url;
  cachedAgent = new ProxyAgent(url);
  return cachedAgent;
}

type FetchInput = Parameters<typeof undiciFetch>[0];
type FetchInit = NonNullable<Parameters<typeof undiciFetch>[1]>;

export async function proxyFetch(
  input: FetchInput,
  init?: FetchInit,
): Promise<Response> {
  try {
    const agent = getAgent();
    return (await undiciFetch(input, {
      ...init,
      ...(agent ? { dispatcher: agent } : {}),
    })) as unknown as Response;
  } catch (err) {
    throw mapNetworkError(err);
  }
}

export function mapNetworkError(err: unknown): Error {
  const cause =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: unknown }).cause
      : undefined;
  const code =
    (cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: string }).code)
      : "") ||
    (err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "");
  const msg = err instanceof Error ? err.message : String(err);

  if (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    /connect timeout|fetch failed|ENOTFOUND|ECONNREFUSED/i.test(msg)
  ) {
    const proxy = proxyUrl();
    if (proxy) {
      return new Error(
        `Cannot reach Leonardo.ai via proxy (${proxy}). Keep Bitz Net ON, then retry Generate.`,
      );
    }
    return new Error(
      "Cannot reach Leonardo.ai (network timeout). Add PIXEL_HTTPS_PROXY=http://127.0.0.1:7897 to web/.env.local, then restart with: npm run dev",
    );
  }

  return err instanceof Error ? err : new Error(msg);
}
