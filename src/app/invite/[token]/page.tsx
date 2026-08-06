import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { InviteAccept } from "@/components/invite-accept";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createServiceClient();
  const { data: invite } = await admin
    .from("event_cohosts")
    .select("id, email, status, event_id, events(title)")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
            <CardDescription>
              This cohost invite link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const eventRelation = Array.isArray(invite.events)
    ? invite.events[0]
    : invite.events;
  const eventTitle = eventRelation?.title || "an event";
  const emailMatches = Boolean(
    user?.email && user.email.toLowerCase() === invite.email.toLowerCase()
  );

  if (invite.status === "accepted") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Invite already accepted</CardTitle>
            <CardDescription>
              You can manage{" "}
              <a className="underline" href={`/events/${invite.event_id}`}>
                {eventTitle}
              </a>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Cohost invitation</CardTitle>
          <CardDescription>
            Join as a cohost for {eventTitle}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteAccept
            token={token}
            eventTitle={eventTitle}
            inviteEmail={invite.email}
            signedIn={Boolean(user)}
            emailMatches={emailMatches}
          />
        </CardContent>
      </Card>
    </div>
  );
}
