"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { buyTicketsSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import {
  getActiveUnitPriceCents,
  isCurrentlyOnSale,
  isPresaleWindow,
} from "@/lib/events";
import type { EventRecord } from "@/lib/types";

const log = createLogger("ticket-actions");

export type BuyResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function createCheckoutSessionAction(
  input: unknown
): Promise<BuyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/")}`);
  }

  const parsed = buyTicketsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { event_id: eventId, quantity, presale_code: submittedCode } =
    parsed.data;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("status", "published")
    .maybeSingle();

  if (eventError || !event) {
    return { ok: false, error: "Event not found or not on sale" };
  }

  const eventRecord = event as EventRecord;
  const now = new Date();

  if (!isCurrentlyOnSale(eventRecord, now)) {
    return { ok: false, error: "Tickets are not currently on sale for this event" };
  }

  const inPresale = isPresaleWindow(eventRecord, now);
  if (inPresale) {
    const expected = (eventRecord.presale_code || "").trim().toLowerCase();
    const provided = (submittedCode || "").trim().toLowerCase();
    if (!expected || provided !== expected) {
      return { ok: false, error: "A valid presale code is required" };
    }
  }

  const { data: existingOrders } = await supabase
    .from("orders")
    .select("quantity, status")
    .eq("event_id", eventId)
    .eq("buyer_id", user.id)
    .in("status", ["pending", "paid"]);

  const alreadyOwned = (existingOrders || []).reduce(
    (sum, row) => sum + row.quantity,
    0
  );

  if (alreadyOwned + quantity > eventRecord.max_tickets_per_user) {
    return {
      ok: false,
      error: `You can purchase at most ${eventRecord.max_tickets_per_user} tickets for this event (you already have ${alreadyOwned}).`,
    };
  }

  const unitPriceCents = getActiveUnitPriceCents(eventRecord, now);
  const totalCents = unitPriceCents * quantity;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      event_id: eventId,
      buyer_id: user.id,
      quantity,
      unit_price_cents: unitPriceCents,
      total_cents: totalCents,
      is_presale: inPresale,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    log.error({ err: orderError }, "Failed to create pending order");
    return { ok: false, error: orderError?.message || "Could not create order" };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitPriceCents,
          product_data: {
            name: `${eventRecord.title} — Ticket`,
            description: `${eventRecord.venue} · ${eventRecord.event_date}`,
          },
        },
      },
    ],
    metadata: {
      order_id: order.id,
      event_id: eventId,
      buyer_id: user.id,
      quantity: String(quantity),
      is_presale: inPresale ? "true" : "false",
    },
    success_url: `${env.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/checkout/cancel?event_id=${eventId}`,
  });

  if (!session.url) {
    return { ok: false, error: "Stripe did not return a checkout URL" };
  }

  await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  log.info(
    { orderId: order.id, sessionId: session.id, eventId },
    "Checkout session created"
  );

  return { ok: true, checkoutUrl: session.url };
}

export async function acceptCohostInviteAction(token: string): Promise<
  { ok: true; eventId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: "You must sign in to accept this invite" };
  }

  const admin = createServiceClient();
  const { data: invite, error } = await admin
    .from("event_cohosts")
    .select("id, event_id, email, status, user_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (error || !invite) {
    return { ok: false, error: "Invite not found or expired" };
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      error: `This invite was sent to ${invite.email}. Sign in with that email (or a social account using it) to accept.`,
    };
  }

  const { error: updateError } = await admin
    .from("event_cohosts")
    .update({
      user_id: user.id,
      status: "accepted",
    })
    .eq("id", invite.id);

  if (updateError) {
    log.error({ err: updateError, token }, "Failed to accept cohost invite");
    return { ok: false, error: updateError.message };
  }

  log.info({ eventId: invite.event_id, userId: user.id }, "Cohost invite accepted");
  revalidatePath(`/events/${invite.event_id}`);
  return { ok: true, eventId: invite.event_id };
}
