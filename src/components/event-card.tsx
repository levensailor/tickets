import Link from "next/link";
import Image from "next/image";
import { formatUsd } from "@/lib/money";
import { getFlyerPublicUrl, isPresaleWindow } from "@/lib/events";
import { publicEnv } from "@/lib/env";
import type { EventWithRelations } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EventCardProps = {
  event: EventWithRelations;
};

export function EventCard({ event }: EventCardProps) {
  const flyer = event.event_flyers?.[0];
  const supabaseUrl = publicEnv.supabaseUrl;
  const imageUrl =
    flyer && supabaseUrl
      ? getFlyerPublicUrl(supabaseUrl, flyer.storage_path)
      : null;
  const presale = isPresaleWindow(event);

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${event.title} flyer`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No flyer
            </div>
          )}
        </div>
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{event.title}</CardTitle>
            {presale ? <Badge variant="secondary">Presale</Badge> : null}
          </div>
          <CardDescription className="line-clamp-1">
            {event.venue}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            {event.event_date} · {event.event_time?.slice(0, 5)}
          </p>
          <p className="font-medium text-foreground">
            {formatUsd(
              presale && event.presale_cost_cents != null
                ? event.presale_cost_cents
                : event.ticket_cost_cents
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
