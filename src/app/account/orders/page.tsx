import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatUsd } from "@/lib/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, events(id, title, venue, event_date, event_time), tickets(id, ticket_code, status)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Purchase history
      </h1>

      {!orders || orders.length === 0 ? (
        <p className="text-muted-foreground">
          You have not purchased any tickets yet.{" "}
          <Link href="/" className="underline">
            Browse events
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const event = Array.isArray(order.events)
              ? order.events[0]
              : order.events;
            const tickets = order.tickets || [];
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      {event ? (
                        <Link
                          href={`/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      ) : (
                        "Event"
                      )}
                    </CardTitle>
                    <CardDescription>
                      {event
                        ? `${event.venue} · ${event.event_date}`
                        : "Event details unavailable"}{" "}
                      · {new Date(order.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      order.status === "paid"
                        ? "default"
                        : order.status === "pending"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    {order.quantity} × {formatUsd(order.unit_price_cents)}
                    {order.is_presale ? " (presale)" : ""} ={" "}
                    <strong>{formatUsd(order.total_cents)}</strong>
                  </p>
                  {tickets.length > 0 ? (
                    <div>
                      <p className="mb-1 font-medium">Tickets</p>
                      <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                        {tickets.map(
                          (ticket: {
                            id: string;
                            ticket_code: string;
                            status: string;
                          }) => (
                            <li key={ticket.id}>
                              {ticket.ticket_code} · {ticket.status}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
