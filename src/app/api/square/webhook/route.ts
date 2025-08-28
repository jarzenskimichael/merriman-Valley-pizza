export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// Basic HMAC verification (Sandbox/Prod): signature over notificationUrl + rawBody
function verifySquareSignature(raw: string, signatureHeader: string, signatureKey: string, notificationUrl: string) {
  if (!signatureHeader || !signatureKey || !notificationUrl) return false;
  const mac = createHmac("sha256", signatureKey);
  mac.update(notificationUrl + raw, "utf8");
  const expected = mac.digest("base64");
  // constant-time-ish compare
  return Buffer.from(signatureHeader).toString("base64") === expected || signatureHeader === expected;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-square-hmacsha256-signature") || "";
  const notifUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:3000/api/square/webhook";
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";

  const ok = verifySquareSignature(raw, sig, key, notifUrl);

  if (!ok) {
    console.warn("⚠️ Webhook signature not verified");
    // In Sandbox you can still accept while testing; for production, keep 403.
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const event = JSON.parse(raw);
  console.log("✅ Square Webhook Event:", event.type, event.data?.id || "");
  return NextResponse.json({ ok: true });
}
