import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { AdminShell, Card } from "../ui";
import { EmailSettingsForm, TestEmailForm } from "./email-forms";

export default function EmailPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading email settings…</p>}>
      <EmailSettings />
    </Suspense>
  );
}

async function EmailSettings() {
  const admin = await requirePermission("settings.email");
  const db = await getDb();
  const rs = await db.execute(
    "SELECT value FROM settings WHERE key = 'notify_email'"
  );
  const row = rs.rows[0] as unknown as { value: string };
  const configured = emailConfigured();

  return (
    <AdminShell
      admin={admin}
      active="email"
      title="Email notifications"
      subtitle="Order confirmations, new-order alerts, and shipping emails."
    >
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              Sending status
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                configured
                  ? "bg-sage/20 text-sage-dark ring-sage/40"
                  : "bg-gold/15 text-gold ring-gold/40"
              }`}
            >
              {configured ? "SMTP connected" : "Setup needed"}
            </span>
          </div>
          {configured ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Emails are sent from <strong>{process.env.SMTP_FROM || process.env.SMTP_USER}</strong>.
              Customers automatically receive a confirmation when they pay, and you
              can email them from any shipped order.
            </p>
          ) : (
            <div className="mt-3 text-sm leading-relaxed text-ink-soft">
              <p>
                Emails are sent through Resend. Add these lines to the{" "}
                <code>.env.local</code> file on the server, then restart it:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-sage-dark p-4 text-xs leading-relaxed text-parchment">
{`SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
SMTP_FROM="The Growth Jar <orders@yourdomain.com>"`}
              </pre>
              <p className="mt-3">
                The password is your Resend API key, and the sender address must
                use a domain you verified in Resend. Until then, orders still
                work — emails are simply skipped and noted in each order&apos;s
                history.
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-7">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              New-order alerts
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Get an email at this address every time an order is paid.
            </p>
            <EmailSettingsForm initial={row.value} />
          </Card>
          <Card className="p-7">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              Send a test email
            </h2>
            <TestEmailForm defaultTo={row.value || admin.email} />
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}