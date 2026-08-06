# Wilmington Tickets

Ticketing app for local music events in Wilmington, North Carolina.

Users sign in with Google, Facebook, Apple, or email. Organizers create events with flyers, lineup, presale codes, and cohosts. Attendees buy tickets through Stripe Checkout. The platform collects all ticket revenue centrally (organizers are paid offline).

**Author:** Chris Levensailor

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase Auth, Postgres, and Storage
- Stripe Checkout (platform-collect)
- Resend for cohost invite emails
- Deployed on Vercel

## Public assets / live URL

- Production URL: set after Vercel deploy (also configure `NEXT_PUBLIC_SITE_URL`)
- Login: open `/login` and choose Google, Facebook, Apple, or email magic link

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
| `NEXT_PUBLIC_APP_NAME` | Display name (default: Wilmington Tickets) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used for OAuth redirects, Stripe, invites) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (webhooks / invites) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | From address for invites |

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel and set all environment variables above.
3. Deploy.
4. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. In each OAuth provider console, add the Supabase callback URL shown in Supabase Auth settings.
6. Set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy if needed.

## Login instructions

1. Visit `/login`.
2. Choose **Continue with Google**, **Facebook**, **Apple**, or enter an email for a magic link.
3. After sign-in, your avatar appears at the top right with **Purchase History**, **Edit Profile**, and **Sign Out**.
4. Create events from the homepage **Create New Event** button.
5. Non-creators open an event to view details and buy tickets.

## Payments model

Stripe Checkout uses a **platform-collect** model: one Stripe account receives all ticket payments. Organizer payouts are handled outside the app.

## Manual SQL

Schema changes ship as SQL files under `supabase/migrations/`. Run them manually in the Supabase SQL editor — they are not applied automatically by the app.
