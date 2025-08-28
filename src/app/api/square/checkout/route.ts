export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SquareAPI } from "@/lib/square";
import type { CreateOrderRequest, CreatePaymentRequest, Money } from "@/types/square";

interface CheckoutBody {
  lineItems: Array<{
    name?: string;
    quantity?: string | number;
    basePriceMoney?: Money;
    base_price_money?: Money;
    catalogObjectId?: string;
    catalog_object_id?: string;
  }>;
  sourceId: string;
  customerId?: string;
  tipMoney?: Money;
  note?: string;
  pickupName?: string;
  pickupPhone?: string;
  pickupWhen?: string; // "ASAP" or RFC3339
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const { lineItems = [], sourceId, customerId, tipMoney, note, pickupName, pickupPhone, pickupWhen } = body;

    if (!sourceId) {
      return NextResponse.json({ ok: false, error: "Missing sourceId" }, { status: 400 });
    }

    const normalized = SquareAPI.normalizeLineItems(lineItems);

    const scheduleType: "ASAP" | "SCHEDULED" =
      !pickupWhen || pickupWhen === "ASAP" ? "ASAP" : "SCHEDULED";

    const orderReq: CreateOrderRequest = {
      idempotency_key: randomUUID(),
      order: {
        location_id: process.env.SQUARE_LOCATION_ID!,
        line_items: normalized,
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickup_details: {
              recipient: {
                display_name: pickupName || "Guest",
                phone_number: pickupPhone || "0000000000",
              },
              schedule_type: scheduleType,
              ...(scheduleType === "SCHEDULED" && pickupWhen ? { pickup_at: pickupWhen } : {}),
            },
          },
        ],
        note: note || "Online order – Merriman Valley Pizza",
      },
    };

    const orderRes = await SquareAPI.createOrder(orderReq);

    const paymentReq: CreatePaymentRequest = {
      idempotency_key: randomUUID(),
      source_id: sourceId,
      amount_money: orderRes.order.total_money!,
      location_id: process.env.SQUARE_LOCATION_ID!,
      order_id: orderRes.order.id,
      customer_id: customerId,
      tip_money: tipMoney,
    };

    const payRes = await SquareAPI.createPayment(paymentReq);

    return NextResponse.json({ ok: true, order: orderRes.order, payment: payRes.payment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Checkout error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
