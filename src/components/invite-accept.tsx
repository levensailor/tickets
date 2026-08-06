"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptCohostInviteAction } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

type InviteAcceptProps = {
  token: string;
  eventTitle: string;
  inviteEmail: string;
  signedIn: boolean;
  emailMatches: boolean;
};

export function InviteAccept({
  token,
  eventTitle,
  inviteEmail,
  signedIn,
  emailMatches,
}: InviteAcceptProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptCohostInviteAction(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/events/${result.eventId}`);
      router.refresh();
    });
  }

  if (!signedIn) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          You were invited to cohost <strong>{eventTitle}</strong>. Sign in with{" "}
          <strong>{inviteEmail}</strong> (email magic link or any social account
          using that email) to accept.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className={buttonVariants()}
        >
          Sign in to accept
        </Link>
      </div>
    );
  }

  if (!emailMatches) {
    return (
      <p className="text-sm text-destructive" role="alert">
        You are signed in with a different email than {inviteEmail}. Sign out and
        sign in with the invited address (or a linked social account).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        Accept cohost access for <strong>{eventTitle}</strong>?
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button onClick={accept} disabled={isPending}>
        {isPending ? "Accepting…" : "Accept cohost invite"}
      </Button>
    </div>
  );
}
