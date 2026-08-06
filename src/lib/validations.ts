import { z } from "zod";

const lineupItemSchema = z.string().min(1, "Lineup artist is required").max(200);

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    venue: z.string().min(1, "Venue is required").max(300),
    event_date: z.string().min(1, "Event date is required"),
    event_time: z.string().min(1, "Event time is required"),
    description: z.string().min(1, "Description is required").max(10000),
    ticket_cost_dollars: z.coerce.number().min(0, "Ticket cost must be >= 0"),
    on_sale_at: z.string().min(1, "On-sale date/time is required"),
    is_presale: z.boolean(),
    presale_at: z.string().optional().nullable(),
    presale_cost_dollars: z.coerce.number().min(0).optional().nullable(),
    presale_code: z.string().max(64).optional().nullable(),
    max_tickets_per_user: z.coerce
      .number()
      .int()
      .min(1, "Must allow at least 1 ticket")
      .max(50),
    lineup: z
      .array(lineupItemSchema)
      .min(1, "At least one lineup artist is required"),
    cohost_emails: z.array(z.string().email("Invalid cohost email")).default([]),
    status: z.enum(["draft", "published"]).default("published"),
  })
  .superRefine((data, ctx) => {
    if (data.is_presale) {
      if (!data.presale_at) {
        ctx.addIssue({
          code: "custom",
          path: ["presale_at"],
          message: "Presale date/time is required when presale is enabled",
        });
      }
      if (
        data.presale_cost_dollars === null ||
        data.presale_cost_dollars === undefined
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["presale_cost_dollars"],
          message: "Presale cost is required when presale is enabled",
        });
      }
      if (!data.presale_code || data.presale_code.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["presale_code"],
          message: "Presale code is required when presale is enabled",
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const buyTicketsSchema = z.object({
  event_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  presale_code: z.string().optional().nullable(),
});

export type BuyTicketsValues = z.infer<typeof buyTicketsSchema>;
