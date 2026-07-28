#!/usr/bin/env node
/**
 * Push local .env.local keys required for production generate to Vercel.
 *
 * Prerequisites:
 *   npx vercel login
 *   npx vercel link   (from web/)
 *
 * Usage:
 *   node scripts/push-vercel-env.mjs
 *
 * Does not print secret values.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LEONARDO_API_KEY",
  "PIXEL_ENGINE",
  "LEONARDO_MODEL_ID",
  "LEONARDO_IMAGE_REF_STRENGTH",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_GUMROAD_CHECKOUT_PREMIUM",
];

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy from .env.local.example first.");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const missing = REQUIRED.filter((k) => !env[k]?.trim());
if (missing.length) {
  console.error("Missing keys in .env.local:", missing.join(", "));
  process.exit(1);
}

// Prefer production site URL when pushing to Vercel.
const siteUrl =
  process.env.VERCEL_SITE_URL?.trim() || "https://www.pixelalley.online";

const values = {
  ...Object.fromEntries(REQUIRED.map((k) => [k, env[k].trim()])),
  NEXT_PUBLIC_SITE_URL: siteUrl,
};

console.log("Pushing env vars to Vercel (Production + Preview + Development)…");
for (const [key, value] of Object.entries(values)) {
  for (const target of ["production", "preview", "development"]) {
    const res = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force", "--yes"],
      {
        cwd: root,
        input: value + "\n",
        encoding: "utf8",
        env: process.env,
      },
    );
    if (res.status !== 0) {
      console.error(`Failed: ${key} (${target})`);
      console.error(res.stderr || res.stdout);
      process.exit(res.status || 1);
    }
  }
  console.log(`✓ ${key}`);
}

console.log("\nDone. Redeploy in Vercel (Deployments → … → Redeploy) for NEXT_PUBLIC_* to take effect.");
