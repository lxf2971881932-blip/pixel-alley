import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "*";
  const allow =
    origin.startsWith("chrome-extension://") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
      ? origin
      : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/** GET /api/sync-codes/[code] — redeem PET-XXXX for extension new tab */
export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const headers = corsHeaders(request);
  const { code: raw } = await context.params;
  const code = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!/^PET-\d{4}$/.test(code)) {
    return NextResponse.json(
      { error: "Invalid sync code format. Use PET-1234." },
      { status: 400, headers },
    );
  }

  const admin = createServiceClient();
  const { data: row, error } = await admin
    .from("pet_sync_codes")
    .select("id, code, payload, expires_at, redeem_count")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
  if (!row) {
    return NextResponse.json(
      { error: "Sync code not found" },
      { status: 404, headers },
    );
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Sync code expired. Generate a new one on the website." },
      { status: 410, headers },
    );
  }

  await admin
    .from("pet_sync_codes")
    .update({
      redeem_count: (row.redeem_count ?? 0) + 1,
      last_redeemed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  return NextResponse.json(
    {
      ok: true,
      code: row.code,
      pet: row.payload,
    },
    { headers },
  );
}
