import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/event-form";
import { BuyTicketsForm } from "@/components/buy-tickets-form";
import { formatUsd } from "@/lib/money";
import {
  getFlyerPublicUrl,
  isCurrentlyOnSale,
  isPresaleWindow,
} from "@/lib/events";
import { publicEnv } from "@/lib/env";
import type { EventCohost, EventFlyer, EventRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_flyers(*), event_cohosts(*)")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const eventRecord = event as EventRecord & {
    event_flyers: EventFlyer[];
    event_cohosts: EventCohost[];
  };

  let isManager = false;
  if (user) {
    if (eventRecord.creator_id === user.id) {
      isManager = true;
    } else {
      const cohost = (eventRecord.event_cohosts || []).find(
        (c) => c.user_id === user.id && c.status === "accepted"
      );
      isManager = Boolean(cohost);
    }
  }

  if (isManager) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Edit event</h1>
        <p className="mb-6 text-muted-foreground">
          You are the creator or an accepted cohost of this event.
        </p>
        <EventForm
          mode="edit"
          event={eventRecord}
          flyers={eventRecord.event_flyers || []}
          cohosts={eventRecord.event_cohosts || []}
        />
      </div>
    );
  }

  const supabaseUrl = publicEnv.supabaseUrl;
  const flyers = (eventRecord.event_flyers || []).sort(
    (a, b) => a.position - b.position
  );
  const onSale = isCurrentlyOnSale(eventRecord);
  const inPresale = isPresaleWindow(eventRecord);

  let remainingAllowed = eventRecord.max_tickets_per_user;
  if (user) {
    const { data: orders } = await supabase
      .from("orders")
      .select("quantity")
      .eq("event_id", id)
      .eq("buyer_id", user.id)
      .in("status", ["pending", "paid"]);
    const owned = (orders || []).reduce((sum, o) => sum + o.quantity, 0);
    remainingAllowed = Math.max(0, eventRecord.max_tickets_per_user - owned);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {eventRecord.title}
              </h1>
              {inPresale ? <Badge>Presale</Badge> : null}
              {!onSale ? <Badge variant="secondary">Not on sale</Badge> : null}
            </div>
            <p className="text-muted-foreground">
              {eventRecord.venue} · {eventRecord.event_date} ·{" "}
              {eventRecord.event_time?.slice(0, 5)}
            </p>
            <p className="mt-2 text-lg font-semibold">
              {formatUsd(
                inPresale && eventRecord.presale_cost_cents != null
                  ? eventRecord.presale_cost_cents
                  : eventRecord.ticket_cost_cents
              )}
            </p>
          </div>

          {flyers.length > 0 && supabaseUrl ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {flyers.map((flyer) => (
                <div
                  key={flyer.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={getFlyerPublicUrl(supabaseUrl, flyer.storage_path)}
                    alt={`${eventRecord.title} flyer ${flyer.position}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div>
            <h2 className="mb-2 text-lg font-semibold">About</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {eventRecord.description}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="mb-2 text-lg font-semibold">Lineup</h2>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {(eventRecord.lineup || []).map((artist) => (
                <li key={artist}>{artist}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {onSale ? (
            <BuyTicketsForm
              event={eventRecord}
              remainingAllowed={remainingAllowed}
              signedIn={Boolean(user)}
            />
          ) : (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Tickets are not currently on sale for this event.
              {eventRecord.is_presale && eventRecord.presale_at ? (
                <p className="mt-2">
                  Presale opens {new Date(eventRecord.presale_at).toLocaleString()}.
                </p>
              ) : null}
              <p className="mt-2">
                General on-sale:{" "}
                {new Date(eventRecord.on_sale_at).toLocaleString()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
