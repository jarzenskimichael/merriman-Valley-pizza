export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SquareAPI } from "../../../../lib/square";

type Check = { name: string; ok: boolean; detail?: string };

export async function GET() {
  const checks: Check[] = [];
  const push = (name: string, ok: boolean, detail?: string) => checks.push({ name, ok, detail });

  try {
    // Env presence
    const required = [
      "SQUARE_ENV","SQUARE_APP_ID","SQUARE_ACCESS_TOKEN","SQUARE_LOCATION_ID",
      "SQUARE_API_VERSION","SQUARE_WEBHOOK_SIGNATURE_KEY",
      "NEXT_PUBLIC_SQUARE_APP_ID","NEXT_PUBLIC_SQUARE_LOCATION_ID","NEXT_PUBLIC_SQUARE_JS_SRC"
    ] as const;
    for (const key of required) {
      const exists = !!process.env[key];
      push("env:" + key, exists, exists ? "present" : "MISSING");
    }

    // Public IDs match server IDs
    const idsMatch =
      process.env.NEXT_PUBLIC_SQUARE_APP_ID === process.env.SQUARE_APP_ID &&
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID === process.env.SQUARE_LOCATION_ID;
    push("env:public ids match", idsMatch, "NEXT_PUBLIC_* should match server values for APP_ID and LOCATION_ID");

    // Webhook URL format
    const nurl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:3000/api/square/webhook";
    push("webhook:url set", !!nurl, nurl);
    push("webhook:url format", /^https?:\/\/.+\/api\/square\/webhook$/.test(nurl), nurl);

    // Connectivity checks (REST)
    try {
      const locs: any = await SquareAPI.listLocations();
      const list = locs.locations || [];
      push("square:locations access", list.length > 0, "found " + list.length);

      const locId = process.env.SQUARE_LOCATION_ID!;
      const loc = list.find((l: any) => l.id === locId);
      push("square:location match", !!loc, loc ? (loc.name + " (" + loc.id + ")") : ("Missing " + locId));

      const cats: any = await SquareAPI.listCatalog();
      push("square:catalog read", true, "objects: " + ((cats.objects || []).length));

      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const orders: any = await SquareAPI.searchOrders({
        location_ids: [locId],
        query: { filter: { date_time_filter: { created_at: { start_at: since } } } },
        limit: 1,
        return_entries: false
      });
      push("square:orders read", true, "orders: " + ((orders.orders || []).length));

      push("square:api version pinned", !!process.env.SQUARE_API_VERSION, process.env.SQUARE_API_VERSION);
    } catch (e: any) {
      push("square:client error", false, e?.message || String(e));
    }

    const ok = checks.every(c => c.ok);
    return NextResponse.json({ ok, checks });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
