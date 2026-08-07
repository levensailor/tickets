# Band Guru

Ticketing app for local music events in Wilmington, North Carolina.

Users sign in with Google, Facebook, Apple, or email. Organizers create events with flyers, lineup, presale codes, and cohosts. Attendees buy tickets through Stripe Checkout. The platform collects all ticket revenue centrally (organizers are paid offline).

**Author:** Chris Levensailor  
**Domain:** [band.guru](https://band.guru)

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase Auth, Postgres, and Storage
- Stripe Checkout (platform-collect)
- Resend for cohost invite emails
- Deployed on Vercel

## Public assets / live URL

- Production domain: [https://band.guru](https://band.guru)
- Vercel URL: [https://tickets-weld-beta.vercel.app](https://tickets-weld-beta.vercel.app)
- App icon (1024×1024): [`/public/icon-1024.png`](public/icon-1024.png)
- Privacy Policy: [https://band.guru/privacy](https://band.guru/privacy)
- Terms of Service: [https://band.guru/terms](https://band.guru/terms)
- Data Deletion: [https://band.guru/data-deletion](https://band.guru/data-deletion)
- Login: open `/login` and choose Google, Facebook, Apple, or email magic link
- GitHub: [https://github.com/levensailor/tickets](https://github.com/levensailor/tickets)

> Auth, database, payments, and email require Supabase / Stripe / Resend credentials in the Vercel project environment variables (see below). Until those are set and the SQL migration is run, the UI will load but sign-in and event data will not work end-to-end.

## Local development

1. Copy `.env.example` to `.env.local` and fill in values.
2. Create a [Supabase](https://supabase.com) project.
3. In Supabase Auth, enable Google, Facebook, Apple, and Email providers. Enable **automatic identity linking by email**.
4. Run the SQL migration in the Supabase SQL editor:
   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
5. Create a [Stripe](https://stripe.com) account and copy test keys.
6. Create a [Resend](https://resend.com) API key for invite emails.
7. Install and run:

```bash
npm install
npm run dev
```

> Prefer deploying to Vercel for a full end-to-end check. Local `npm run dev` is optional.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Display name (default: Band Guru) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email shown on Privacy / Terms / Data Deletion pages |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (default: https://band.guru) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (webhooks / invites / account deletion) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | From address for invites |

## Deploy on Vercel

1. Push this repository to GitHub (already linked: `levensailor/tickets`).
2. In the Vercel project **tickets**, set all environment variables above for Production (and Preview if desired).
3. Set `NEXT_PUBLIC_SITE_URL` to `https://band.guru` (or your current Vercel URL until DNS is live) and redeploy.
4. Attach the custom domain `band.guru` in the Vercel project Domains settings.
5. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   - URL: `https://band.guru/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. In each OAuth provider console, add the Supabase callback URL shown in Supabase Auth settings, and use:
   - Privacy: `https://band.guru/privacy`
   - Terms: `https://band.guru/terms`
   - Data deletion: `https://band.guru/data-deletion`
7. Run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) in the Supabase SQL editor.

## Login instructions

1. Visit `/login`.
2. Choose **Continue with Google**, **Facebook**, **Apple**, or enter an email for a magic link.
3. After sign-in, your avatar appears at the top right with **Purchase History**, **Edit Profile**, and **Sign Out**.
4. Create events from the homepage **Create New Event** button.
5. Non-creators open an event to view details and buy tickets.
6. To delete your account and data, open **Edit Profile** or visit `/data-deletion`.

## Payments model

Stripe Checkout uses a **platform-collect** model: one Stripe account receives all ticket payments. Organizer payouts are handled outside the app.

## Manual SQL

Schema changes ship as SQL files under `supabase/migrations/`. Run them manually in the Supabase SQL editor — they are not applied automatically by the app.
