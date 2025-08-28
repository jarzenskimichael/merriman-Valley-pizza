export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { ListLocationsResponse } from "@/types/square";

const BASE_URL =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

export async function GET() {
  const res = await fetch(BASE_URL + "/locations", {
    headers: {
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": process.env.SQUARE_API_VERSION || "2025-01-23",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const data = (await res.json()) as ListLocationsResponse;
  return NextResponse.json({ ok: res.ok, status: res.status, data });
}
