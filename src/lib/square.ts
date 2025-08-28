const BASE_URL =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

// Generic fetch with auth + version headers
async function sqFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": process.env.SQUARE_API_VERSION || "2025-01-23",
      ...(init.headers || {}),
    },
    // ensure Node runtime
    cache: "no-store" as any,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Square API ${res.status} ${res.statusText}: ${text || "<no body>"}`);
  }
  return res.json();
}

// Map camelCase line items from UI to Square snake_case
function normalizeLineItems(lineItems: any[] = []) {
  return lineItems.map((li) => {
    const out: any = {
      name: li.name,
      quantity: String(li.quantity || li.qty || "1"),
    };
    // price can arrive as camelCase or snake_case
    const bpm = li.basePriceMoney || li.base_price_money;
    if (bpm?.amount && bpm?.currency) {
      out.base_price_money = { amount: Number(bpm.amount), currency: String(bpm.currency) };
    }
    // support catalogObjectId if provided
    if (li.catalogObjectId || li.catalog_object_id) {
      out.catalog_object_id = li.catalog_object_id || li.catalogObjectId;
    }
    return out;
  });
}

export const SquareAPI = {
  listLocations: () => sqFetch("/locations"),
  listCatalog: () => sqFetch("/catalog/list?types=ITEM,ITEM_VARIATION"),
  searchOrders: (body: any) =>
    sqFetch("/orders/search", { method: "POST", body: JSON.stringify(body) }),
  createOrder: (body: any) =>
    sqFetch("/orders", { method: "POST", body: JSON.stringify(body) }),
  createPayment: (body: any) =>
    sqFetch("/payments", { method: "POST", body: JSON.stringify(body) }),
  normalizeLineItems,
};
