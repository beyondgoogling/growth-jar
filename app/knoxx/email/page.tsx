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
    "SELECT key, value FROM settings WHERE key IN ('notify_email', 'notify_email_2')"
  );
  const map = Object.fromEntries(
    rs.rows.map((r) => [r.key as string, String(r.value)])
  );
  const notifyEmail = map.notify_email ?? "";
  const notifyEmail2 = map.notify_email_2 ?? "";
  const configured = emailConfigured();

  return (
    <AdminShell
      admin={admin}
      active="email"
      title="Email notifications"
      subtitle="Customer emails and the activity notifications you receive."
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold text-sage-dark">
                Activity notifications
              </h2>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold ring-1 ring-gold/40">
                Owner only
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              These two addresses get an email for everything that happens: new
              orders, payments (success or failure), order status changes, notes,
              shipping emails, price changes, team account changes, and admin
              sign-ins. Admins are never emailed about their own actions — only
              what others do.
            </p>
            <EmailSettingsForm initial={notifyEmail} initial2={notifyEmail2} />
          </Card>
          <Card className="p-7">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              Send a test email
            </h2>
            <TestEmailForm defaultTo={notifyEmail || admin.email} />
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}