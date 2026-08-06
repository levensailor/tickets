import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Service-role client for webhooks and privileged server operations. Bypasses RLS. */
export function createServiceClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
