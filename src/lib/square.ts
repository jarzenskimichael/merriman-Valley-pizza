import { Client, Environment } from "@square/square";

/**
 * Create a configured Square client.
 * - Uses SQUARE_ENV: sandbox | production
 * - Uses SQUARE_ACCESS_TOKEN (unless an override token is provided)
 * - Pins API version via SQUARE_API_VERSION (YYYY-MM-DD)
 */
export function makeSquareClient(token?: string): Client {
  const envRaw = (process.env.SQUARE_ENV || "sandbox").toLowerCase();
  const environment =
    envRaw === "production" || envRaw === "prod"
      ? Environment.Production
      : Environment.Sandbox;

  const accessToken = token ?? process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN in environment.");
  }

  // Square recommends pinning the API version (YYYY-MM-DD)
  const squareVersion = process.env.SQUARE_API_VERSION || "2025-01-23";

  return new Client({
    accessToken,
    environment,
    userAgentDetail: "MerrimanValleyPizza/1.0 (+mvpizza)",
    squareVersion,
  });
}

/** Optional aggregate export so other files can import { SquareAPI } if they want. */
export const SquareAPI = { makeSquareClient };

export default makeSquareClient;
