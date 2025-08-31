import { makeSquareClient } from "./square";

/**
 * Fetch a map of variationId -> { quantity: number }
 */
export async function getInventoryMap(): Promise<Record<string, { quantity: number }>> {
  const client = makeSquareClient();
  const loc = process.env.SQUARE_LOCATION_ID!;
  const map: Record<string, { quantity: number }> = {};

  const res = await client.inventoryApi.batchRetrieveInventoryCounts({
    locationIds: [loc],
    states: ["IN_STOCK"],
  } as any);

  for (const c of res.result.counts ?? []) {
    const vid = c.catalogObjectId!;
    const qty = Number(c.quantity ?? 0);
    map[vid] = { quantity: qty };
  }

  return map;
}
