import { NextResponse } from "next/server";
import { makeSquareClient } from "@/lib/square";
import { getInventoryMap } from "@/lib/inventory";
export const runtime = "nodejs";

export async function GET() {
  const client = makeSquareClient();
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const cats = await client.catalogApi.listCatalog(undefined, "ITEM,ITEM_VARIATION,IMAGE");
  const objs = cats.result.objects ?? [];

  const images = new Map(objs.filter(o=>o.type==="IMAGE").map(o=>[o.id!, (o as any).imageData?.url as string]));
  const varsByItem = new Map<string, any[]>();
  for (const v of objs.filter(o=>o.type==="ITEM_VARIATION")) {
    const itemId = (v as any).itemVariationData?.itemId as string | undefined;
    if (!itemId) continue;
    const arr = varsByItem.get(itemId) || [];
    arr.push(v);
    varsByItem.set(itemId, arr);
  }

  const inv = await getInventoryMap();

  const menu = objs.filter(o=>o.type==="ITEM").map(item=>{
    const id = item.id!;
    const data:any = (item as any).itemData || {};
    const imageUrl = data.imageIds?.length ? images.get(data.imageIds[0]) : undefined;

    const variations = (varsByItem.get(id) || []).map(v=>{
      const vid = v.id!;
      const d:any = (v as any).itemVariationData || {};
      const ov = (d.locationOverrides || []).find((o:any)=>o.locationId===locationId) || {};
      const soldOut = ov.soldOut === true || !!ov.soldOutUntil;
      const trackInventory = (ov.trackInventory ?? d.trackInventory) === true;
      const qty = Number(inv[vid]?.quantity ?? 0);
      const available = soldOut ? false : (trackInventory ? qty > 0 : true);
      const priceCents = Number(d.priceMoney?.amount ?? 0);
      return {
        id: vid,
        name: d.name || "Default",
        price: { amount: priceCents, currency: d.priceMoney?.currency || "USD" },
        quantity: qty,
        available,
        soldOut,
      };
    }).sort((a:any,b:any)=>Number(b.available)-Number(a.available));

    return { id, name: data.name, description: data.description || "", imageUrl, variations };
  });

  return NextResponse.json({ menu, locationId, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
