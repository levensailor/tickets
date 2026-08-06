/**
 * Centralized environment configuration.
 * Never hardcode provider names, URLs, or secrets — read from env.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] || fallback;
}

export const env = {
  get appName() {
    return optionalEnv("NEXT_PUBLIC_APP_NAME", "Wilmington Tickets");
  },
  get siteUrl() {
    return optionalEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  },
  get supabaseUrl() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get stripeSecretKey() {
    return requireEnv("STRIPE_SECRET_KEY");
  },
  get stripePublishableKey() {
    return requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  },
  get stripeWebhookSecret() {
    return requireEnv("STRIPE_WEBHOOK_SECRET");
  },
  get resendApiKey() {
    return requireEnv("RESEND_API_KEY");
  },
  get resendFromEmail() {
    return optionalEnv(
      "RESEND_FROM_EMAIL",
      "Wilmington Tickets <onboarding@resend.dev>"
    );
  },
};

/** Safe public env for client components (no secrets). */
export const publicEnv = {
  get appName() {
    return optionalEnv("NEXT_PUBLIC_APP_NAME", "Wilmington Tickets");
  },
  get siteUrl() {
    return optionalEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  },
  get supabaseUrl() {
    return optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get stripePublishableKey() {
    return optionalEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  },
};
