/** Minimal types covering what we use from Square's REST API */

export type Currency = string; // e.g. "USD"

export interface Money {
  amount: number;              // in the smallest unit (cents)
  currency: Currency;
}

export interface Location {
  id: string;
  name?: string;
}

export type CatalogObjectType = "ITEM" | "ITEM_VARIATION" | "IMAGE";

export interface CatalogItemVariationData {
  name?: string;
  price_money?: Money;
}

export interface CatalogItemData {
  name?: string;
  description?: string;
  variations?: Array<{ id: string }>;
  image_ids?: string[];
  image_url?: string; // legacy fallback
}

export interface CatalogImageData {
  url?: string;
  full_url?: string;
}

export interface CatalogObject {
  id: string;
  type: CatalogObjectType;
  item_data?: CatalogItemData;
  item_variation_data?: CatalogItemVariationData;
  image_data?: CatalogImageData;
}

export interface OrderLineItem {
  name?: string;
  quantity: string; // per Square API
  base_price_money?: Money;
  catalog_object_id?: string;
}

export interface Order {
  id: string;
  location_id?: string;
  created_at?: string;
  line_items?: OrderLineItem[];
  total_money?: Money;
}

export interface SearchOrdersRequest {
  location_ids: string[];
  query?: {
    filter?: {
      date_time_filter?: {
        created_at?: { start_at?: string; end_at?: string };
      };
    };
  };
  limit?: number;
  return_entries?: boolean;
  sort?: { sort_field: "CREATED_AT"; sort_order?: "ASC" | "DESC" };
}

export interface ListLocationsResponse {
  locations?: Location[];
}

export interface ListCatalogResponse {
  objects?: CatalogObject[];
}

export interface CreateOrderRequest {
  idempotency_key: string;
  order: {
    location_id: string;
    line_items: OrderLineItem[];
    fulfillments?: Array<{
      type: "PICKUP";
      state: "PROPOSED" | "RESERVED" | "PREPARED" | "COMPLETED" | "CANCELED";
      pickup_details: {
        recipient: { display_name?: string; phone_number?: string };
        schedule_type: "ASAP" | "SCHEDULED";
        pickup_at?: string; // RFC 3339
      };
    }>;
    note?: string;
  };
}

export interface CreateOrderResponse {
  order: Order;
}

export interface CreatePaymentRequest {
  idempotency_key: string;
  source_id: string;
  amount_money: Money;
  location_id: string;
  order_id?: string;
  customer_id?: string;
  tip_money?: Money;
}

export interface CreatePaymentResponse {
  payment: {
    id: string;
    status?: string;
    amount_money: Money;
    order_id?: string;
  };
}
