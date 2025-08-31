import { NextResponse } from "next/server";
import { makeSquareClient } from "@/lib/square";

export const runtime = "nodejs";

export async function GET() {
  const client = makeSquareClient();
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const cats = await client.catalogApi.listCatalog(undefined, "ITEM,ITEM_VARIATION");
  const objs = cats.result.objects ?? [];
  const items = objs.filter(o => o.type === "ITEM");
  const variations = objs.filter(o => o.type === "ITEM_VARIATION").map(v => {
    const data: any = (v as any).itemVariationData || {};
    const override = (data.locationOverrides || []).find((o: any) => o.locationId === locationId) || {};
    return {
      id: v.id,
      name: data.name,
      itemId: data.itemId,
      trackInventory: data.trackInventory ?? null,
      overrideForLocation: {
        locationId,
        soldOut: override.soldOut ?? null,
        soldOutUntil: override.soldOutUntil ?? null,
        trackInventory: override.trackInventory ?? null,
      }
    };
  });
  return NextResponse.json({ items: items.length, variations }, { headers: { "Cache-Control": "no-store" } });
}
