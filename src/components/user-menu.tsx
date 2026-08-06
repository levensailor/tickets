"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  profile: Pick<
    Profile,
    "id" | "first_name" | "last_name" | "avatar_url" | "email"
  >;
};

function initials(profile: UserMenuProps["profile"]): string {
  const first = profile.first_name?.[0] || "";
  const last = profile.last_name?.[0] || "";
  const value = `${first}${last}`.toUpperCase();
  return value || profile.email?.[0]?.toUpperCase() || "?";
}

export function UserMenu({ profile }: UserMenuProps) {
  const router = useRouter();
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email;

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out failed", error);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
          <AvatarFallback>{initials(profile)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account/orders" />}>
          Purchase History
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/profile" />}>
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
