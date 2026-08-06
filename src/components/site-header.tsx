import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { UserMenu } from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const appName = publicEnv.appName;
  let profile = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  } catch {
    // Env may be unset during first boot / build without secrets
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {appName}
        </Link>
        <div className="flex items-center gap-3">
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
