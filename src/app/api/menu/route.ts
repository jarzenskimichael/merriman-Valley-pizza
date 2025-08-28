export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SquareAPI } from "@/lib/square";
import type { CatalogObject, ListCatalogResponse } from "@/types/square";

export interface MenuVariation {
  id: string;
  name: string;
  price: { amount: number; currency: string };
}
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  variations: MenuVariation[];
}

export async function GET() {
  try {
    const cat = (await SquareAPI.listCatalog()) as ListCatalogResponse;
    const objs: CatalogObject[] = cat.objects ?? [];

    const items = objs.filter((o) => o.type === "ITEM");
    const vars  = objs.filter((o) => o.type === "ITEM_VARIATION");
    const imgs  = objs.filter((o) => o.type === "IMAGE");

    const imageMap = new Map<string, string>();
    for (const im of imgs) {
      const url = im.image_data?.url ?? im.image_data?.full_url ?? "";
      if (im.id && url) imageMap.set(im.id, url);
    }

    const varMap = new Map<string, CatalogObject>();
    for (const v of vars) varMap.set(v.id, v);

    const menu: MenuItem[] = items.map((it) => {
      const data = it.item_data ?? {};
      const vIds = (data.variations ?? []).map((v) => v.id);

      let imageUrl: string | undefined;
      const imageIds = (data.image_ids ?? []);
      for (const iid of imageIds) {
        const url = imageMap.get(iid);
        if (url) { imageUrl = url; break; }
      }
      if (!imageUrl && data.image_url) imageUrl = data.image_url;

      const variations: MenuVariation[] = vIds.map((id) => {
        const v = varMap.get(id);
        const vd = v?.item_variation_data ?? {};
        const money = vd.price_money ?? { amount: 0, currency: "USD" };
        return {
          id,
          name: vd.name ?? data.name ?? "Variation",
          price: { amount: Number(money.amount ?? 0), currency: money.currency ?? "USD" },
        };
      });

      return {
        id: it.id,
        name: data.name ?? "Item",
        description: data.description ?? "",
        imageUrl,
        variations,
      };
    });

    return NextResponse.json({ ok: true, menu });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, menu: [], error: msg }, { status: 500 });
  }
}
