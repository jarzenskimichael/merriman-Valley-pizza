import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const required = [
    "SQUARE_ENV",
    "SQUARE_APP_ID",
    "SQUARE_ACCESS_TOKEN",
    "SQUARE_LOCATION_ID",
    "SQUARE_API_VERSION",
    "SQUARE_WEBHOOK_SIGNATURE_KEY",
    "NEXT_PUBLIC_SQUARE_APP_ID",
    "NEXT_PUBLIC_SQUARE_LOCATION_ID",
    "NEXT_PUBLIC_SQUARE_JS_SRC",
  ];
  const env = Object.fromEntries(required.map(k => [k, !!process.env[k]]));

  return NextResponse.json({
    env,
    values: {
      SQUARE_ENV: process.env.SQUARE_ENV,
      SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
      NEXT_PUBLIC_SQUARE_APP_ID: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      NEXT_PUBLIC_SQUARE_LOCATION_ID: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      NEXT_PUBLIC_SQUARE_JS_SRC: process.env.NEXT_PUBLIC_SQUARE_JS_SRC,
      SQUARE_API_VERSION: process.env.SQUARE_API_VERSION,
    },
    now: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
