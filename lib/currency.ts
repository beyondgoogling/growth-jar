import "server-only";
import { headers } from "next/headers";
import type { Currency } from "./format";

// Vercel sets this header from the visitor's IP. Missing (local dev) or NG → naira.
export async function visitorCurrency(): Promise<Currency> {
  const country = (await headers()).get("x-vercel-ip-country");
  return country && country !== "NG" ? "USD" : "NGN";
}