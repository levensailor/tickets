"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { eventFormSchema } from "@/lib/validations";
import { dollarsToCents } from "@/lib/money";
import { sendCohostInviteEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { FLYERS_BUCKET, MAX_FLYERS_PER_EVENT } from "@/lib/types";

const log = createLogger("event-actions");

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/events/new")}`);
  }
  return { supabase, user };
}

async function isEventManager(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return false;
  if (event.creator_id === userId) return true;

  const { data: cohost } = await supabase
    .from("event_cohosts")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  return Boolean(cohost);
}

async function syncCohosts(params: {
  eventId: string;
  eventTitle: string;
  emails: string[];
  inviterName: string;
  creatorId: string;
}) {
  const admin = createServiceClient();
  const { eventId, eventTitle, emails, inviterName, creatorId } = params;
  const normalized = [
    ...new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    ),
  ];

  const { data: existing } = await admin
    .from("event_cohosts")
    .select("id, email")
    .eq("event_id", eventId);

  const existingEmails = new Set(
    (existing || []).map((row) => row.email.toLowerCase())
  );

  for (const email of normalized) {
    if (existingEmails.has(email)) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (profile && profile.id === creatorId) {
      continue;
    }

    if (profile) {
      const { error } = await admin.from("event_cohosts").insert({
        event_id: eventId,
        user_id: profile.id,
        email: profile.email,
        status: "accepted",
      });
      if (error) {
        log.error({ err: error, email }, "Failed to insert accepted cohost");
      }
      continue;
    }

    const { data: pending, error } = await admin
      .from("event_cohosts")
      .insert({
        event_id: eventId,
        user_id: null,
        email,
        status: "pending",
      })
      .select("invite_token")
      .single();

    if (error || !pending) {
      log.error({ err: error, email }, "Failed to insert pending cohost");
      continue;
    }

    const inviteUrl = `${env.siteUrl}/invite/${pending.invite_token}`;
    await sendCohostInviteEmail({
      toEmail: email,
      eventTitle,
      inviterName,
      inviteUrl,
    });
  }
}

async function uploadFlyers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  files: File[]
) {
  const limited = files.slice(0, MAX_FLYERS_PER_EVENT);
  for (let i = 0; i < limited.length; i += 1) {
    const file = limited[i];
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${eventId}/${i + 1}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FLYERS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      log.error({ err: uploadError, storagePath }, "Flyer upload failed");
      throw new Error(`Flyer upload failed: ${uploadError.message}`);
    }
    const { error: insertError } = await supabase.from("event_flyers").insert({
      event_id: eventId,
      storage_path: storagePath,
      position: i + 1,
    });
    if (insertError) {
      log.error({ err: insertError }, "Flyer row insert failed");
      throw new Error(`Flyer save failed: ${insertError.message}`);
    }
  }
}

export type ActionResult = { ok: true; eventId: string } | { ok: false; error: string };

export async function createEventAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const raw = {
    title: String(formData.get("title") || ""),
    venue: String(formData.get("venue") || ""),
    event_date: String(formData.get("event_date") || ""),
    event_time: String(formData.get("event_time") || ""),
    description: String(formData.get("description") || ""),
    ticket_cost_dollars: formData.get("ticket_cost_dollars"),
    on_sale_at: String(formData.get("on_sale_at") || ""),
    is_presale: formData.get("is_presale") === "true" || formData.get("is_presale") === "on",
    presale_at: String(formData.get("presale_at") || "") || null,
    presale_cost_dollars: formData.get("presale_cost_dollars") || null,
    presale_code: String(formData.get("presale_code") || "") || null,
    max_tickets_per_user: formData.get("max_tickets_per_user"),
    lineup: String(formData.get("lineup") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    cohost_emails: String(formData.get("cohost_emails") || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    status: (String(formData.get("status") || "published") as "draft" | "published"),
  };

  const parsed = eventFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid form" };
  }

  const values = parsed.data;
  const onSaleAt = new Date(values.on_sale_at).toISOString();
  const presaleAt = values.is_presale && values.presale_at
    ? new Date(values.presale_at).toISOString()
    : null;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      creator_id: user.id,
      title: values.title,
      venue: values.venue,
      event_date: values.event_date,
      event_time: values.event_time,
      description: values.description,
      ticket_cost_cents: dollarsToCents(values.ticket_cost_dollars),
      on_sale_at: onSaleAt,
      is_presale: values.is_presale,
      presale_at: presaleAt,
      presale_cost_cents: values.is_presale
        ? dollarsToCents(Number(values.presale_cost_dollars || 0))
        : null,
      presale_code: values.is_presale ? values.presale_code : null,
      max_tickets_per_user: values.max_tickets_per_user,
      lineup: values.lineup,
      status: values.status,
    })
    .select("id, title")
    .single();

  if (error || !event) {
    log.error({ err: error }, "Create event failed");
    return { ok: false, error: error?.message || "Failed to create event" };
  }

  const flyerFiles = formData
    .getAll("flyers")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (flyerFiles.length > 0) {
    try {
      await uploadFlyers(supabase, event.id, flyerFiles);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Flyer upload failed",
      };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const inviterName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "An organizer";

  await syncCohosts({
    eventId: event.id,
    eventTitle: event.title,
    emails: values.cohost_emails,
    inviterName,
    creatorId: user.id,
  });

  log.info({ eventId: event.id }, "Event created");
  revalidatePath("/");
  revalidatePath(`/events/${event.id}`);
  return { ok: true, eventId: event.id };
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const canManage = await isEventManager(supabase, eventId, user.id);
  if (!canManage) {
    return { ok: false, error: "You are not allowed to edit this event" };
  }

  const raw = {
    title: String(formData.get("title") || ""),
    venue: String(formData.get("venue") || ""),
    event_date: String(formData.get("event_date") || ""),
    event_time: String(formData.get("event_time") || ""),
    description: String(formData.get("description") || ""),
    ticket_cost_dollars: formData.get("ticket_cost_dollars"),
    on_sale_at: String(formData.get("on_sale_at") || ""),
    is_presale: formData.get("is_presale") === "true" || formData.get("is_presale") === "on",
    presale_at: String(formData.get("presale_at") || "") || null,
    presale_cost_dollars: formData.get("presale_cost_dollars") || null,
    presale_code: String(formData.get("presale_code") || "") || null,
    max_tickets_per_user: formData.get("max_tickets_per_user"),
    lineup: String(formData.get("lineup") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    cohost_emails: String(formData.get("cohost_emails") || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    status: (String(formData.get("status") || "published") as "draft" | "published"),
  };

  const parsed = eventFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid form" };
  }

  const values = parsed.data;
  const onSaleAt = new Date(values.on_sale_at).toISOString();
  const presaleAt = values.is_presale && values.presale_at
    ? new Date(values.presale_at).toISOString()
    : null;

  const { error } = await supabase
    .from("events")
    .update({
      title: values.title,
      venue: values.venue,
      event_date: values.event_date,
      event_time: values.event_time,
      description: values.description,
      ticket_cost_cents: dollarsToCents(values.ticket_cost_dollars),
      on_sale_at: onSaleAt,
      is_presale: values.is_presale,
      presale_at: presaleAt,
      presale_cost_cents: values.is_presale
        ? dollarsToCents(Number(values.presale_cost_dollars || 0))
        : null,
      presale_code: values.is_presale ? values.presale_code : null,
      max_tickets_per_user: values.max_tickets_per_user,
      lineup: values.lineup,
      status: values.status,
    })
    .eq("id", eventId);

  if (error) {
    log.error({ err: error, eventId }, "Update event failed");
    return { ok: false, error: error.message };
  }

  const replaceFlyers = formData.get("replace_flyers") === "true";
  const flyerFiles = formData
    .getAll("flyers")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (replaceFlyers && flyerFiles.length > 0) {
    const { data: oldFlyers } = await supabase
      .from("event_flyers")
      .select("id, storage_path")
      .eq("event_id", eventId);

    if (oldFlyers?.length) {
      await supabase.storage
        .from(FLYERS_BUCKET)
        .remove(oldFlyers.map((f) => f.storage_path));
      await supabase.from("event_flyers").delete().eq("event_id", eventId);
    }

    try {
      await uploadFlyers(supabase, eventId, flyerFiles);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Flyer upload failed",
      };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const inviterName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "An organizer";

  await syncCohosts({
    eventId,
    eventTitle: values.title,
    emails: values.cohost_emails,
    inviterName,
    creatorId: user.id,
  });

  log.info({ eventId }, "Event updated");
  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  return { ok: true, eventId };
}
