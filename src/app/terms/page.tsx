import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { publicEnv } from "@/lib/env";

const appName = publicEnv.appName;
const siteUrl = publicEnv.siteUrl;
const contactEmail = publicEnv.contactEmail;

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${appName}`,
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="August 7, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of{" "}
        {appName} at <a href={siteUrl}>{siteUrl}</a> (the &quot;Service&quot;). By
        creating an account, signing in, browsing events, creating events, or
        purchasing tickets, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        {appName} is a platform for discovering, creating, and buying tickets to
        local music events in Wilmington, North Carolina. Features may include
        account authentication, event listings, event management, cohosting, and
        online ticket checkout.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be able to form a binding contract to use the Service.</li>
        <li>
          You may sign in using supported identity providers (such as Google,
          Facebook, or Apple) or email-based authentication.
        </li>
        <li>
          You are responsible for activity under your account and for keeping
          access to your sign-in methods secure.
        </li>
        <li>
          You agree to provide accurate information and to keep your profile
          information reasonably up to date.
        </li>
      </ul>

      <h2>3. Event organizers and cohosts</h2>
      <p>If you create or manage an event, you agree that:</p>
      <ul>
        <li>
          You are responsible for the accuracy of event details, pricing,
          lineup, venue, dates, and promotional images.
        </li>
        <li>
          You will only invite cohosts using email addresses you are authorized
          to contact for that purpose.
        </li>
        <li>
          You are responsible for fulfilling the event and any organizer
          obligations to attendees, venues, and performers.
        </li>
        <li>
          Ticket revenue may be collected by the platform&apos;s payment
          processor; organizer payout arrangements are handled outside the
          automated checkout flow unless otherwise stated.
        </li>
      </ul>

      <h2>4. Ticket purchases</h2>
      <ul>
        <li>
          Ticket availability, pricing, and purchase limits are determined by
          event settings and may include general on-sale and presale windows.
        </li>
        <li>
          Presale purchases may require a valid code set by the event organizer.
        </li>
        <li>
          Payments are processed by Stripe. By completing a purchase, you also
          agree to Stripe&apos;s applicable terms.
        </li>
        <li>
          Unless otherwise required by law or expressly stated for a specific
          event, ticket purchases are final subject to any refund policy
          communicated for that event.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any applicable law or third-party right</li>
        <li>Misrepresent your identity or affiliation</li>
        <li>Upload unlawful, infringing, or misleading content</li>
        <li>Attempt to circumvent ticket limits, pricing, or access controls</li>
        <li>Interfere with or disrupt the Service or its infrastructure</li>
        <li>
          Scrape, reverse engineer, or abuse the Service except as allowed by
          law
        </li>
      </ul>

      <h2>6. Content</h2>
      <p>
        You retain ownership of content you submit (such as event descriptions
        and flyer images). You grant us a non-exclusive, worldwide, royalty-free
        license to host, display, and distribute that content as needed to
        operate and promote the Service. You represent that you have the rights
        needed to submit that content.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Service relies on third-party providers for authentication, hosting,
        payments, and email delivery. Those services are subject to their own
        terms and privacy policies. We are not responsible for third-party
        services outside our reasonable control.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
        WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
        IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        AND NON-INFRINGEMENT. We do not guarantee uninterrupted availability,
        that events will occur as described, or that ticket purchases will be
        free from third-party processing delays or errors.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {appName.toUpperCase()} AND ITS
        OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
        GOODWILL, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR
        USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE
        SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US FOR
        THE TRANSACTION GIVING RISE TO THE CLAIM IN THE TWELVE MONTHS BEFORE THE
        CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100).
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless {appName} and its
        operators from claims, damages, losses, and expenses (including
        reasonable attorneys&apos; fees) arising out of your use of the Service,
        your content, your events, or your violation of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate access to the Service if you violate these
        Terms, create risk or legal exposure, or if we discontinue the Service.
        You may stop using the Service at any time.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. The updated Terms will be
        posted on this page with a revised effective date. Continued use of the
        Service after changes become effective constitutes acceptance of the
        updated Terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of North Carolina,
        without regard to conflict-of-law principles, except where applicable
        consumer protection laws require otherwise.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
      <p>
        See also our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/data-deletion">Data Deletion</Link> instructions.
      </p>
    </LegalPage>
  );
}
