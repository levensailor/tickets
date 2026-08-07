import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { buttonVariants } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const appName = publicEnv.appName;
const siteUrl = publicEnv.siteUrl;
const contactEmail = publicEnv.contactEmail;

export const metadata: Metadata = {
  title: "Data Deletion",
  description: `How to delete your ${appName} account and personal data`,
};

export const dynamic = "force-dynamic";

type DataDeletionPageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function DataDeletionPage({
  searchParams,
}: DataDeletionPageProps) {
  const params = await searchParams;
  let signedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    // Env may be unset
  }

  return (
    <LegalPage title="User Data Deletion" effectiveDate="August 7, 2026">
      {params.deleted === "1" ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4" role="status">
          Your account and associated personal data have been deleted. If you
          signed in with Google, Facebook, or Apple, you may also revoke{" "}
          {appName}&apos;s access in that provider&apos;s account settings.
        </p>
      ) : null}

      <p>
        {appName} ({siteUrl}) lets you permanently delete your account and the
        personal data we store about you. This page explains what is deleted and
        how to request deletion. OAuth providers (including Facebook and Google)
        may link to this URL for app review and user data deletion instructions.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your profile (name, email, avatar)</li>
        <li>Authentication identities linked to your account</li>
        <li>Events you created, including flyer images stored by {appName}</li>
        <li>Cohost relationships tied to your user id</li>
        <li>Your ticket orders and ticket codes</li>
      </ul>

      <h2>What may be retained</h2>
      <ul>
        <li>
          Payment processor records held by Stripe as required for fraud
          prevention, accounting, or legal compliance
        </li>
        <li>
          Aggregated or anonymized analytics that no longer identify you
        </li>
        <li>
          Information we must keep to comply with law, resolve disputes, or
          enforce our Terms
        </li>
      </ul>

      <h2>How to delete your data (in-app)</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Sign in to {appName} at{" "}
          <a href={`${siteUrl}/login`}>{siteUrl}/login</a>
        </li>
        <li>
          Open <Link href="/account/profile">Edit Profile</Link> from the avatar
          menu
        </li>
        <li>
          Scroll to <strong>Delete account</strong>, type <code>DELETE</code>,
          and confirm
        </li>
      </ol>

      <p className="pt-2">
        {signedIn ? (
          <Link
            href="/account/profile"
            className={buttonVariants({ variant: "destructive" })}
          >
            Go to profile to delete account
          </Link>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent("/account/profile")}`}
            className={buttonVariants()}
          >
            Sign in to delete your account
          </Link>
        )}
      </p>

      <h2>How to request deletion by email</h2>
      <p>
        If you cannot access your account, email{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> from the email
        address associated with your account. Include:
      </p>
      <ul>
        <li>Subject line: &quot;Data deletion request&quot;</li>
        <li>The email address used to sign in</li>
        <li>Any social provider you used (Google, Facebook, Apple, or email)</li>
      </ul>
      <p>
        We will verify ownership of the account and delete associated personal
        data within 30 days, unless a longer period is required by law.
      </p>

      <h2>After deletion</h2>
      <p>
        Deletion is permanent. You will need to create a new account if you use{" "}
        {appName} again. Purchased tickets for past events will no longer appear
        in the app after account deletion.
      </p>

      <p>
        Related: <Link href="/privacy">Privacy Policy</Link> ·{" "}
        <Link href="/terms">Terms of Service</Link>
      </p>
    </LegalPage>
  );
}
