import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { publicEnv } from "@/lib/env";

const appName = publicEnv.appName;
const siteUrl = publicEnv.siteUrl || "https://tickets-weld-beta.vercel.app";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "privacy@example.com";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${appName}`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="August 7, 2026">
      <p>
        This Privacy Policy explains how {appName} (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) collects, uses, and shares information when you use our
        website and services at{" "}
        <a href={siteUrl}>{siteUrl}</a> (the &quot;Service&quot;). The Service helps
        people discover, create, and buy tickets for local music events in
        Wilmington, North Carolina.
      </p>

      <h2>1. Information we collect</h2>
      <p>We may collect the following categories of information:</p>
      <ul>
        <li>
          <strong>Account and identity information.</strong> When you sign in with
          Google, Facebook, Apple, or email, we receive information from that
          identity provider, which may include your first name, last name, email
          address, and profile photo (avatar).
        </li>
        <li>
          <strong>Profile information.</strong> Information you choose to update in
          your account, such as your name or avatar.
        </li>
        <li>
          <strong>Event and ticketing information.</strong> Event details you
          create or edit, cohost email addresses you provide, ticket purchases,
          order history, and related records.
        </li>
        <li>
          <strong>Payment information.</strong> Payments are processed by Stripe.
          We do not store full payment card numbers on our servers. We may retain
          order amounts, status, and Stripe session or payment identifiers needed
          to fulfill tickets and provide support.
        </li>
        <li>
          <strong>Technical information.</strong> Standard log data such as IP
          address, browser type, device information, and timestamps generated when
          you use the Service.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account and authenticate your identity</li>
        <li>Display your profile information within the Service</li>
        <li>Enable event creation, cohosting, and ticket purchases</li>
        <li>Send transactional messages, such as cohost invitations and purchase confirmations</li>
        <li>Process payments and prevent fraud or abuse</li>
        <li>Operate, maintain, secure, and improve the Service</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>
        We share information with service providers that help us operate the
        Service, including:
      </p>
      <ul>
        <li>
          <strong>Authentication and database hosting</strong> providers that store
          account, event, and order data
        </li>
        <li>
          <strong>Payment processors</strong> (Stripe) to complete ticket purchases
        </li>
        <li>
          <strong>Email delivery providers</strong> to send cohost invitations and
          similar transactional emails
        </li>
        <li>
          <strong>Hosting and infrastructure providers</strong> used to run the
          application
        </li>
      </ul>
      <p>
        We may also share information if required by law, to protect rights and
        safety, or in connection with a business transfer. We do not sell your
        personal information.
      </p>

      <h2>4. Sign-in with third-party accounts</h2>
      <p>
        If you choose to sign in with Google, Facebook, Apple, or another
        supported identity provider, that provider authenticates you and may share
        basic profile information with us as described above. Your use of those
        providers is also governed by their own privacy policies and terms.
      </p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We use cookies and similar technologies as needed to maintain signed-in
        sessions, protect the Service, and support core functionality. You can
        control cookies through your browser settings, but disabling them may
        prevent sign-in or other features from working.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain account, event, and purchase information for as long as needed
        to provide the Service, fulfill transactions, resolve disputes, enforce
        agreements, and meet legal or accounting requirements.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable administrative, technical, and organizational measures
        designed to protect personal information. No method of transmission or
        storage is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>8. Children&apos;s privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly
        collect personal information from children under 13. If you believe a
        child has provided us personal information, contact us so we can take
        appropriate action.
      </p>

      <h2>9. Your choices</h2>
      <p>
        You may update certain profile information in the Service. Depending on
        applicable law, you may also have rights to access, correct, or delete
        personal information, or to request a copy of the information we hold
        about you. To make a request, contact us using the details below.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the
        updated policy on this page and revise the effective date. Continued use
        of the Service after changes become effective constitutes acceptance of
        the updated policy.
      </p>

      <h2>11. Contact us</h2>
      <p>
        Questions about this Privacy Policy or our privacy practices can be sent
        to{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
      <p>
        See also our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
