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

const DEFAULT_APP_NAME = "Band Guru";
const DEFAULT_SITE_URL = "https://band.guru";
const DEFAULT_CONTACT_EMAIL = "privacy@band.guru";
const DEFAULT_RESEND_FROM = "Band Guru <noreply@band.guru>";

export const env = {
  get appName() {
    return optionalEnv("NEXT_PUBLIC_APP_NAME", DEFAULT_APP_NAME);
  },
  get siteUrl() {
    return optionalEnv("NEXT_PUBLIC_SITE_URL", DEFAULT_SITE_URL);
  },
  get contactEmail() {
    return optionalEnv("NEXT_PUBLIC_CONTACT_EMAIL", DEFAULT_CONTACT_EMAIL);
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
    return optionalEnv("RESEND_FROM_EMAIL", DEFAULT_RESEND_FROM);
  },
};

/** Safe public env for client components (no secrets). */
export const publicEnv = {
  get appName() {
    return optionalEnv("NEXT_PUBLIC_APP_NAME", DEFAULT_APP_NAME);
  },
  get siteUrl() {
    return optionalEnv("NEXT_PUBLIC_SITE_URL", DEFAULT_SITE_URL);
  },
  get contactEmail() {
    return optionalEnv("NEXT_PUBLIC_CONTACT_EMAIL", DEFAULT_CONTACT_EMAIL);
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
