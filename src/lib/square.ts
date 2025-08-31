import { Client, Environment } from "@square/square";

/**
 * Create a configured Square client.
 * - SQUARE_ENV: "sandbox" | "production"
 * - SQUARE_ACCESS_TOKEN: required
 * - SQUARE_API_VERSION: YYYY-MM-DD (defaults to 2025-01-23)
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

  const squareVersion = process.env.SQUARE_API_VERSION || "2025-01-23";

  return new Client({
    accessToken,
    environment,
    userAgentDetail: "MerrimanValleyPizza/1.0 (+mvpizza)",
    squareVersion,
  });
}

export default makeSquareClient;
export const SquareAPI = { makeSquareClient };
