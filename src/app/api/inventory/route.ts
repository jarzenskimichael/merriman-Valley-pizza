import { NextResponse } from "next/server";
import { getInventoryMap } from "@/lib/inventory";

export const runtime = "nodejs";

export async function GET() {
  const inv = await getInventoryMap();
  return NextResponse.json({ inv, updatedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "no-store" }
  });
}
