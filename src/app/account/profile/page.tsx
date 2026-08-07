import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { DeleteAccountCard } from "@/components/delete-account-card";
import type { Profile } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-muted-foreground">
          Profile not found. Try signing out and back in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Edit profile</h1>
        <p className="text-sm text-muted-foreground">
          Need help removing your data? See our{" "}
          <Link href="/data-deletion" className="underline">
            data deletion instructions
          </Link>
          .
        </p>
      </div>
      <ProfileForm profile={profile as Profile} />
      <DeleteAccountCard />
    </div>
  );
}
