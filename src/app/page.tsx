import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isCurrentlyOnSale } from "@/lib/events";
import { publicEnv } from "@/lib/env";
import type { EventWithRelations } from "@/lib/types";
import { EventCard } from "@/components/event-card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const appName = publicEnv.appName;
  let events: EventWithRelations[] = [];
  let signedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    const { data } = await supabase
      .from("events")
      .select("*, event_flyers(*)")
      .eq("status", "published")
      .order("event_date", { ascending: true });

    events = ((data || []) as EventWithRelations[]).filter((event) =>
      isCurrentlyOnSale(event)
    );
  } catch {
    // Missing env during build/preview without secrets
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Events on sale
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Public music events currently on sale in Wilmington, NC via{" "}
            {appName}.
          </p>
        </div>
        <Link
          href={signedIn ? "/events/new" : "/login?next=/events/new"}
          className={buttonVariants({ size: "lg" })}
        >
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No events are currently on sale. Be the first to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
