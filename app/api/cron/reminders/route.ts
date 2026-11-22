import { getOrdersDueForReminder, markReminderSent } from "@/lib/db";
import { emailConfigured, sendPaymentReminderEmail } from "@/lib/email";

function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!emailConfigured())
    return Response.json({ sent: 0, skipped: "SMTP not configured" });

  const due = await getOrdersDueForReminder();
  let sent = 0;
  for (const order of due) {
    const ok = await sendPaymentReminderEmail(
      order,
      `${siteUrl()}/pay/${order.reference}`
    );
    if (ok) {
      await markReminderSent(order.id);
      sent++;
    }
  }
  return Response.json({ due: due.length, sent });
}