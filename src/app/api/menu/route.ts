import { NextResponse } from "next/server";
import { makeSquareClient } from "@/lib/square";
import { getInventoryMap } from "@/lib/inventory";

export const runtime = "nodejs";

export async function GET() {
  const client = makeSquareClient();
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const cats = await client.catalogApi.listCatalog(undefined, "ITEM,ITEM_VARIATION,IMAGE");
  const objs = cats.result.objects ?? [];

  const images = new Map(objs.filter(o => o.type === "IMAGE").map(o => [o.id!, (o as any).imageData?.url as string]));
  const variationsByItem = new Map<string, any[]>();
  for (const v of objs.filter(o => o.type === "ITEM_VARIATION")) {
    const itemId = (v as any).itemVariationData?.itemId as string | undefined;
    if (itemId) {
      const arr = variationsByItem.get(itemId) || [];
      arr.push(v);
      variationsByItem.set(itemId, arr);
    }
  }

  // Pull inventory counts as a secondary signal
  const inv = await getInventoryMap();

  const menu = objs
    .filter(o => o.type === "ITEM")
    .map(item => {
      const id = item.id!;
      const data: any = (item as any).itemData || {};
      const imageUrl = data.imageIds?.length ? images.get(data.imageIds[0]) : undefined;

      const variations = (variationsByItem.get(id) || [])
        .map(v => {
          const vid = v.id!;
          const vdata: any = (v as any).itemVariationData || {};

          // Location override flags (this is how “Mark as sold out” works in Square UI)
          const override = (vdata.locationOverrides || []).find((o: any) => o.locationId === locationId) || {};
          const soldOut = override.soldOut === true || override.soldOutUntil; // either explicitly sold out or until a time
          const trackInventory = (override.trackInventory ?? vdata.trackInventory) === true;

          // Inventory quantity (if tracked)
          const qty = Number(inv[vid]?.quantity ?? 0);

          // Availability logic:
          // - Sold out override wins
          // - Else, if tracking inventory, qty > 0
          // - Else, available
          const available = soldOut ? false : (trackInventory ? qty > 0 : true);

          const priceCents = Number(vdata.priceMoney?.amount ?? 0);
          return {
            id: vid,
            name: vdata.name || "Default",
            price: { amount: priceCents, currency: vdata.priceMoney?.currency || "USD" },
            quantity: qty,
            available,
            soldOut,
          };
        })
        .sort((a: any, b: any) => Number(b.available) - Number(a.available));

      return {
        id,
        name: data.name,
        description: data.description || "",
        imageUrl,
        variations,
      };
    });

  return NextResponse.json({ menu, locationId, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
