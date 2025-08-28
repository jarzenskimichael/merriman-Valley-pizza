export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SquareAPI } from "@/lib/square";

export async function POST(req: NextRequest) {
  try {
    const {
      lineItems = [],
      sourceId,
      customerId,
      tipMoney,
      note,
      // optional form fields from client:
      pickupName,
      pickupPhone,
      pickupWhen, // ISO string or "ASAP"
    } = await req.json();

    if (!sourceId) {
      return NextResponse.json({ ok: false, error: "Missing sourceId" }, { status: 400 });
    }

    // Normalize line items (camelCase -> snake_case)
    const normalized = SquareAPI.normalizeLineItems(lineItems);

    // Build minimal pickup details (required by Square for type=PICKUP)
    const pickup_details: any = {
      recipient: {
        display_name: pickupName || "Guest",
        phone_number: pickupPhone || "0000000000",
      },
      schedule_type: (!pickupWhen || pickupWhen === "ASAP") ? "ASAP" : "SCHEDULED",
    };
    if (pickup_details.schedule_type === "SCHEDULED" && pickupWhen && pickupWhen !== "ASAP") {
      // pickup_at must be RFC 3339 timestamp if scheduled
      pickup_details.pickup_at = pickupWhen;
    }

    // 1) Create order (REST snake_case)
    const orderRes: any = await SquareAPI.createOrder({
      idempotency_key: randomUUID(),
      order: {
        location_id: process.env.SQUARE_LOCATION_ID!,
        line_items: normalized,
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickup_details,
          },
        ],
        note: note || "Online order – Merriman Valley Pizza",
      },
    });

    // 2) Take payment for the order total
    const payRes: any = await SquareAPI.createPayment({
      idempotency_key: randomUUID(),
      source_id: sourceId,
      amount_money: orderRes.order.total_money,
      location_id: process.env.SQUARE_LOCATION_ID!,
      order_id: orderRes.order.id,
      customer_id: customerId,
      tip_money: tipMoney,
    });

    return NextResponse.json({ ok: true, order: orderRes.order, payment: payRes.payment });
  } catch (err: any) {
    console.error("Checkout error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
