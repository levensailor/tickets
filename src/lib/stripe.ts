import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}
