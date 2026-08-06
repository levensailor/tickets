import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth-callback");

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      log.error({ err: error }, "Failed to exchange auth code");
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
    log.info("Auth session established");
    return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
