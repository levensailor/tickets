"use client";

import { useState, useTransition } from "react";
import { createCheckoutSessionAction } from "@/app/actions/tickets";
import { formatUsd } from "@/lib/money";
import type { EventRecord } from "@/lib/types";
import { isPresaleWindow } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BuyTicketsFormProps = {
  event: EventRecord;
  remainingAllowed: number;
  signedIn: boolean;
};

export function BuyTicketsForm({
  event,
  remainingAllowed,
  signedIn,
}: BuyTicketsFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [presaleCode, setPresaleCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inPresale = isPresaleWindow(event);
  const unitPrice =
    inPresale && event.presale_cost_cents != null
      ? event.presale_cost_cents
      : event.ticket_cost_cents;

  function handleBuy() {
    setError(null);
    if (!signedIn) {
      window.location.href = `/login?next=${encodeURIComponent(`/events/${event.id}`)}`;
      return;
    }
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        event_id: event.id,
        quantity,
        presale_code: inPresale ? presaleCode : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.checkoutUrl;
    });
  }

  if (remainingAllowed < 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            You have reached the maximum of {event.max_tickets_per_user} tickets
            for this event.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy tickets</CardTitle>
        <CardDescription>
          {inPresale ? "Presale pricing" : "General admission"} ·{" "}
          {formatUsd(unitPrice)} each · max {event.max_tickets_per_user} per
          user
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={remainingAllowed}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        {inPresale ? (
          <div className="space-y-2">
            <Label htmlFor="presale_code">Presale code</Label>
            <Input
              id="presale_code"
              value={presaleCode}
              onChange={(e) => setPresaleCode(e.target.value)}
              required
            />
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Total: {formatUsd(unitPrice * quantity)}
        </p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button onClick={handleBuy} disabled={isPending} className="w-full">
          {isPending
            ? "Redirecting to checkout…"
            : signedIn
              ? "Checkout with Stripe"
              : "Sign in to buy"}
        </Button>
      </CardContent>
    </Card>
  );
}
