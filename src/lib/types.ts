export type EventStatus = "draft" | "published";
export type CohostStatus = "pending" | "accepted";
export type OrderStatus = "pending" | "paid" | "refunded";
export type TicketStatus = "valid" | "used" | "cancelled";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface EventRecord {
  id: string;
  creator_id: string;
  title: string;
  venue: string;
  event_date: string;
  event_time: string;
  description: string;
  ticket_cost_cents: number;
  on_sale_at: string;
  is_presale: boolean;
  presale_at: string | null;
  presale_cost_cents: number | null;
  presale_code: string | null;
  max_tickets_per_user: number;
  lineup: string[];
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventFlyer {
  id: string;
  event_id: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface EventCohost {
  id: string;
  event_id: string;
  user_id: string | null;
  email: string;
  status: CohostStatus;
  invite_token: string;
  invited_at: string;
}

export interface Order {
  id: string;
  event_id: string;
  buyer_id: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  is_presale: boolean;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface Ticket {
  id: string;
  order_id: string;
  event_id: string;
  buyer_id: string;
  ticket_code: string;
  status: TicketStatus;
  created_at: string;
}

export interface EventWithRelations extends EventRecord {
  event_flyers?: EventFlyer[];
  event_cohosts?: EventCohost[];
  profiles?: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url" | "email">;
}

export const FLYERS_BUCKET = "flyers";
export const MAX_FLYERS_PER_EVENT = 3;
