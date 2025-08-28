import type {
  ListLocationsResponse,
  ListCatalogResponse,
  SearchOrdersRequest,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  OrderLineItem,
  Money,
} from "@/types/square";

const BASE_URL =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

/** Generic fetch with auth + version headers and typed JSON response */
async function sqFetch<TResp>(path: string, init: RequestInit = {}): Promise<TResp> {
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": process.env.SQUARE_API_VERSION || "2025-01-23",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Square API ${res.status} ${res.statusText}: ${text || "<no body>"}`);
  }
  return res.json() as Promise<TResp>;
}

/** Normalize UI cart lines (camelCase) to Square OrderLineItem (snake_case converted by API layer) */
function normalizeLineItems(lineItems: Array<{
  name?: string;
  quantity?: string | number;
  basePriceMoney?: Money;
  base_price_money?: Money;
  catalogObjectId?: string;
  catalog_object_id?: string;
}> = []): OrderLineItem[] {
  return lineItems.map((li) => {
    const out: OrderLineItem = {
      name: li.name,
      quantity: String(li.quantity ?? 1),
    };
    const bpm = li.basePriceMoney ?? li.base_price_money;
    if (bpm?.amount && bpm?.currency) {
      out.base_price_money = { amount: Number(bpm.amount), currency: String(bpm.currency) };
    }
    if (li.catalog_object_id || li.catalogObjectId) {
      out.catalog_object_id = li.catalog_object_id ?? li.catalogObjectId;
    }
    return out;
  });
}

export const SquareAPI = {
  listLocations: (): Promise<ListLocationsResponse> => sqFetch("/locations"),
  listCatalog: (): Promise<ListCatalogResponse> => sqFetch("/catalog/list?types=ITEM,ITEM_VARIATION,IMAGE"),
  searchOrders: (body: SearchOrdersRequest): Promise<{ orders?: Order[] }> =>
    sqFetch("/orders/search", { method: "POST", body: JSON.stringify(body) }),
  createOrder: (body: CreateOrderRequest): Promise<CreateOrderResponse> =>
    sqFetch("/orders", { method: "POST", body: JSON.stringify(body) }),
  createPayment: (body: CreatePaymentRequest): Promise<CreatePaymentResponse> =>
    sqFetch("/payments", { method: "POST", body: JSON.stringify(body) }),
  normalizeLineItems,
};
