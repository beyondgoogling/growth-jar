import { getOrdersDueForReminder, markReminderSent } from "@/lib/db";
import { emailConfigured, sendPaymentReminderEmail, siteUrl } from "@/lib/email";

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