import { NextResponse } from "next/server";
import { makeSquareClient } from "@/lib/square";

export const runtime = "nodejs";

export async function GET() {
  const result: any = {
    ok: false,
    env: {
      SQUARE_ENV: process.env.SQUARE_ENV,
      SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
      SQUARE_API_VERSION: process.env.SQUARE_API_VERSION,
    },
    checks: [] as { name:string; ok:boolean; detail?:string }[],
  };

  function push(name: string, ok: boolean, detail?: string) {
    result.checks.push({ name, ok, detail });
  }

  try {
    const client = makeSquareClient();
    push("square:client init", true, "client constructed");

    const locs = await client.locationsApi.listLocations();
    const all = locs.result.locations ?? [];
    push("square:locations access", all.length > 0, `found: ${all.length}`);

    const locId = process.env.SQUARE_LOCATION_ID!;
    const match = all.find(l => l.id === locId);
    push("square:location match", !!match, match ? `${match.name} (${match.id})` : `Missing ${locId}`);

    result.ok = result.checks.every(c => c.ok);
  } catch (e: any) {
    push("square:error", false, e?.message || String(e));
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
