export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SquareAPI } from "@/lib/square";

/**
 * Returns a normalized menu:
 * [
 *   {
 *     id, name, description, imageUrl?,
 *     variations: [{ id, name, price: { amount, currency } }]
 *   }, ...
 * ]
 */
export async function GET() {
  try {
    const cat: any = await SquareAPI.listCatalog();
    const objs = cat.objects || [];

    const items = objs.filter((o: any) => o.type === "ITEM");
    const vars  = objs.filter((o: any) => o.type === "ITEM_VARIATION");
    const imgs  = objs.filter((o: any) => o.type === "IMAGE");

    // map id -> image url
    const imageMap: Record<string, string> = {};
    for (const im of imgs) {
      const url =
        im.image_data?.url ||
        im.image_data?.full_url || // safety
        im?.data?.url || "";       // super-safety
      if (im.id && url) imageMap[im.id] = url;
    }

    // map varId -> varObject
    const varMap: Record<string, any> = {};
    for (const v of vars) varMap[v.id] = v;

    const menu = items.map((it: any) => {
      const data = it.item_data || {};
      const vIds = (data.variations || []).map((v: any) => v.id);

      // pick an image for the item
      let imageUrl: string | undefined = undefined;
      const imageIds: string[] =
        (data.image_ids as string[]) ||
        (data.imageIds as string[]) ||
        [];
      if (imageIds.length > 0) {
        // use the first available image id that resolves
        for (const iid of imageIds) {
          if (imageMap[iid]) { imageUrl = imageMap[iid]; break; }
        }
      }
      // fallback to legacy image_url field if present
      if (!imageUrl && data.image_url) imageUrl = data.image_url;

      const variations = vIds.map((id: string) => {
        const v = varMap[id];
        const vd = v?.item_variation_data || {};
        const money = vd.price_money || {};
        return {
          id,
          name: vd.name || data.name || "Variation",
          price: { amount: Number(money.amount || 0), currency: money.currency || "USD" },
        };
      });

      return {
        id: it.id,
        name: data.name || "Item",
        description: data.description || "",
        imageUrl,
        variations,
      };
    });

    return NextResponse.json({ ok: true, menu });
  } catch (e: any) {
    return NextResponse.json({ ok: false, menu: [], error: e?.message || String(e) }, { status: 500 });
  }
}
