import type { EventRecord } from "@/lib/types";

export function isCurrentlyOnSale(event: EventRecord, now = new Date()): boolean {
  if (event.status !== "published") return false;
  const onSaleAt = new Date(event.on_sale_at);
  if (Number.isNaN(onSaleAt.getTime())) return false;
  if (now < onSaleAt) {
    if (event.is_presale && event.presale_at) {
      const presaleAt = new Date(event.presale_at);
      return !Number.isNaN(presaleAt.getTime()) && now >= presaleAt;
    }
    return false;
  }
  return true;
}

export function isPresaleWindow(event: EventRecord, now = new Date()): boolean {
  if (!event.is_presale || !event.presale_at) return false;
  const presaleAt = new Date(event.presale_at);
  const onSaleAt = new Date(event.on_sale_at);
  if (Number.isNaN(presaleAt.getTime()) || Number.isNaN(onSaleAt.getTime())) {
    return false;
  }
  return now >= presaleAt && now < onSaleAt;
}

export function getActiveUnitPriceCents(
  event: EventRecord,
  now = new Date()
): number {
  if (isPresaleWindow(event, now) && event.presale_cost_cents != null) {
    return event.presale_cost_cents;
  }
  return event.ticket_cost_cents;
}

export function getFlyerPublicUrl(
  supabaseUrl: string,
  storagePath: string
): string {
  const bucket = "flyers";
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}
