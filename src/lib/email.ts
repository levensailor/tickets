import { Resend } from "resend";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("email");

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey);
  }
  return resendClient;
}

export async function sendCohostInviteEmail(params: {
  toEmail: string;
  eventTitle: string;
  inviterName: string;
  inviteUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { toEmail, eventTitle, inviterName, inviteUrl } = params;
  const appName = env.appName;

  try {
    const { error } = await getResend().emails.send({
      from: env.resendFromEmail,
      to: toEmail,
      subject: `You're invited to cohost: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h1 style="color: #111;">Cohost invitation</h1>
          <p>Hi,</p>
          <p><strong>${inviterName}</strong> invited you to cohost <strong>${eventTitle}</strong> on ${appName}.</p>
          <p>Sign in with the email address this invite was sent to (or any social account using that same email) to accept:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
              Accept invite
            </a>
          </p>
          <p style="color:#666;font-size:12px;">If you did not expect this email, you can ignore it.</p>
        </div>
      `,
    });

    if (error) {
      log.error({ err: error, toEmail }, "Failed to send cohost invite");
      return { ok: false, error: error.message };
    }

    log.info({ toEmail, eventTitle }, "Cohost invite sent");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    log.error({ err, toEmail }, "Cohost invite exception");
    return { ok: false, error: message };
  }
}
