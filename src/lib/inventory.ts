import { makeSquareClient } from "./square";

/**
 * Fetch a map of variationId -> { quantity: number }
 * for a single location using Square Inventory API.
 */
export async function getInventoryMap() {
  const client = makeSquareClient();
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const map: Record<string, { quantity: number }> = {};

  // We’ll pull counts for all catalog objects used on menu.
  // If you want to scope, pass specific object IDs.
  // API: inventoryApi.batchRetrieveInventoryCounts
  const counts = await client.inventoryApi.batchRetrieveInventoryCounts({
    locationIds: [locationId],
    states: ["IN_STOCK", "RESERVED", "SOLD", "WASTE", "UNLINKED_RETURN", "SUPPORTED_BY_NEWER_VERSION"],
  } as any);

  for (const c of counts.result.counts ?? []) {
    // We care about sellable qty at this location; Square exposes quantity as string
    const qty = Number(c.quantity ?? "0");
    const varId = c.catalogObjectId!;
    if (!map[varId]) map[varId] = { quantity: 0 };
    // For simplicity, treat IN_STOCK as available; other states reduce availability
    if (c.state === "IN_STOCK") map[varId].quantity += qty;
  }

  return map;
}
