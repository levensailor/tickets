"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createEventAction,
  updateEventAction,
} from "@/app/actions/events";
import { centsToDollars } from "@/lib/money";
import type { EventCohost, EventFlyer, EventRecord } from "@/lib/types";
import { MAX_FLYERS_PER_EVENT } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EventFormProps = {
  mode: "create" | "edit";
  event?: EventRecord;
  flyers?: EventFlyer[];
  cohosts?: EventCohost[];
};

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ mode, event, flyers = [], cohosts = [] }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPresale, setIsPresale] = useState(event?.is_presale ?? false);

  const initialCohostEmails = useMemo(
    () => cohosts.map((c) => c.email).join("\n"),
    [cohosts]
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("is_presale", isPresale ? "true" : "false");
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEventAction(formData)
          : await updateEventAction(event!.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/events/${result.eventId}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create event" : "Edit event"}</CardTitle>
        <CardDescription>
          All fields below are required for a public Band Guru music event.
          Upload up to {MAX_FLYERS_PER_EVENT} flyer images.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={event?.title || ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                name="venue"
                required
                defaultValue={event?.venue || ""}
                placeholder="e.g. Greenfield Lake Amphitheater"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Event date</Label>
              <Input
                id="event_date"
                name="event_date"
                type="date"
                required
                defaultValue={event?.event_date || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Event time</Label>
              <Input
                id="event_time"
                name="event_time"
                type="time"
                required
                defaultValue={event?.event_time?.slice(0, 5) || ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={5}
                defaultValue={event?.description || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_cost_dollars">Ticket cost (USD)</Label>
              <Input
                id="ticket_cost_dollars"
                name="ticket_cost_dollars"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={
                  event ? centsToDollars(event.ticket_cost_cents) : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="on_sale_at">On sale date/time</Label>
              <Input
                id="on_sale_at"
                name="on_sale_at"
                type="datetime-local"
                required
                defaultValue={toLocalInputValue(event?.on_sale_at)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tickets_per_user">
                Max tickets per user
              </Label>
              <Input
                id="max_tickets_per_user"
                name="max_tickets_per_user"
                type="number"
                min="1"
                max="50"
                required
                defaultValue={event?.max_tickets_per_user ?? 4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={event?.status || "published"}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_presale"
                checked={isPresale}
                onCheckedChange={(checked) => setIsPresale(checked === true)}
              />
              <Label htmlFor="is_presale">Enable presale?</Label>
            </div>
            {isPresale ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="presale_at">Presale date/time</Label>
                  <Input
                    id="presale_at"
                    name="presale_at"
                    type="datetime-local"
                    required={isPresale}
                    defaultValue={toLocalInputValue(event?.presale_at)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presale_cost_dollars">Presale cost (USD)</Label>
                  <Input
                    id="presale_cost_dollars"
                    name="presale_cost_dollars"
                    type="number"
                    min="0"
                    step="0.01"
                    required={isPresale}
                    defaultValue={
                      event?.presale_cost_cents != null
                        ? centsToDollars(event.presale_cost_cents)
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presale_code">Presale code</Label>
                  <Input
                    id="presale_code"
                    name="presale_code"
                    required={isPresale}
                    defaultValue={event?.presale_code || ""}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lineup">Lineup (one artist per line)</Label>
            <Textarea
              id="lineup"
              name="lineup"
              required
              rows={4}
              defaultValue={(event?.lineup || []).join("\n")}
              placeholder={"Headliner\nOpener\nLocal support"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cohost_emails">
              Cohosts (emails, comma or newline separated)
            </Label>
            <Textarea
              id="cohost_emails"
              name="cohost_emails"
              rows={3}
              defaultValue={initialCohostEmails}
              placeholder="friend@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Matching accounts are added immediately. Otherwise an invite email
              is sent.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flyers">
              Flyer images (up to {MAX_FLYERS_PER_EVENT})
              {mode === "edit" ? " — upload to replace existing" : ""}
            </Label>
            <Input
              id="flyers"
              name="flyers"
              type="file"
              accept="image/*"
              multiple
              required={mode === "create"}
            />
            {mode === "edit" ? (
              <input type="hidden" name="replace_flyers" value="true" />
            ) : null}
            {flyers.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Current flyers: {flyers.length}. New uploads replace all existing
                flyers.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create event"
                : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
