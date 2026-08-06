import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { generateTicketCode } from "@/lib/money";
import { createLogger } from "@/lib/logger";
import type Stripe from "stripe";

const log = createLogger("stripe-webhook");

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.stripeWebhookSecret
    );
  } catch (err) {
    log.error({ err }, "Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const eventId = session.metadata?.event_id;
    const buyerId = session.metadata?.buyer_id;
    const quantity = Number(session.metadata?.quantity || 0);

    if (!orderId || !eventId || !buyerId || quantity < 1) {
      log.error({ metadata: session.metadata }, "Missing checkout metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const admin = createServiceClient();

    const { data: order } = await admin
      .from("orders")
      .select("id, status, quantity")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      log.error({ orderId }, "Order not found for webhook");
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      log.info({ orderId }, "Order already paid — idempotent skip");
      return NextResponse.json({ received: true });
    }

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "paid",
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntent,
      })
      .eq("id", orderId);

    if (updateError) {
      log.error({ err: updateError, orderId }, "Failed to mark order paid");
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const ticketRows = Array.from({ length: order.quantity }, () => ({
      order_id: orderId,
      event_id: eventId,
      buyer_id: buyerId,
      ticket_code: generateTicketCode(),
      status: "valid" as const,
    }));

    const { error: ticketError } = await admin.from("tickets").insert(ticketRows);
    if (ticketError) {
      log.error({ err: ticketError, orderId }, "Failed to create tickets");
      return NextResponse.json({ error: "Ticket creation failed" }, { status: 500 });
    }

    log.info(
      { orderId, eventId, quantity: order.quantity },
      "Order paid and tickets issued"
    );
  }

  return NextResponse.json({ received: true });
}
