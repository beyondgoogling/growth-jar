import "server-only";
import nodemailer from "nodemailer";
import { getNotifyEmails, logAdminEvent, logEvent, type Order } from "./db";
import { naira, usd, money, DELIVERY_LABELS, PACKAGE_LABELS } from "./format";

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function fromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f2ea;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf9f4;border:1px solid #d8d2c2;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#414d38;padding:24px 32px;">
          <span style="color:#fbf9f4;font-size:18px;letter-spacing:3px;text-transform:uppercase;">The Growth Jar</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;color:#414d38;font-size:26px;font-weight:normal;">${title}</h1>
          <div style="color:#3a3f33;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#efe9dd;color:#6b7060;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
          The Growth Jar Experience · Don't just count your blessings. Document your becoming.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function orderTable(order: Order): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#6b7060;">${k}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f6f2ea;border-radius:12px;padding:8px 16px;">
    ${row("Order reference", escapeHtml(order.reference))}
    ${row("Package", `${PACKAGE_LABELS[order.package]} × ${order.quantity}`)}
    ${row("Delivery", DELIVERY_LABELS[order.delivery_method])}
    ${row("Shipping", order.delivery_method === "pickup" ? "No fee (pick up)" : order.currency === "USD" ? "Arranged in chat" : naira(order.shipping_kobo))}
    ${row("Total", money(order.total_kobo, order.currency === "USD" ? "USD" : "NGN"))}
  </table>`;
}

function addressHtml(order: Order): string {
  return [order.address_line, order.city, order.state, order.country]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");
}

async function send(to: string, subject: string, html: string) {
  await transporter().sendMail({ from: fromAddress(), to, subject, html });
}

export async function sendOrderConfirmation(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    await send(
      order.email,
      `Your Growth Jar pre-order is confirmed (${order.reference})`,
      layout(
        "Thank you — your pre-order is confirmed!",
        `<p>Hi ${escapeHtml(order.customer_name)},</p>
         ${
           order.delivery_method === "pickup"
             ? "<p>We've received your payment. You chose <strong>pick up</strong> — a sales representative will reach out to you shortly to help arrange your collection.</p>"
             : "<p>We've received your payment. Your Growth Jar Experience is reserved and will ship to you after the official launch on <strong>12 December 2026</strong>.</p>"
         }
         ${orderTable(order)}
         <p><strong>${order.delivery_method === "pickup" ? "Your address:" : "Shipping to:"}</strong><br>${addressHtml(order)}</p>
         ${
           order.delivery_method === "pickup"
             ? "<p>Keep your order reference safe — our representative will use it when they contact you.</p>"
             : "<p>We'll email you again the moment your order ships. Keep your order reference safe.</p>"
         }
         <p style="color:#a8842c;font-style:italic;">Don't just count your blessings. Document your becoming.</p>`
      )
    );
    await logEvent(order.id, `Confirmation email sent to ${order.email}`);
    return true;
  } catch {
    await logEvent(order.id, "Confirmation email failed to send");
    return false;
  }
}

export async function sendAdminNewOrderAlert(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  const to = (await getNotifyEmails()).join(", ");
  if (!to) return false;
  try {
    await send(
      to,
      `New paid order: ${order.reference} — ${money(order.total_kobo, order.currency === "USD" ? "USD" : "NGN")}`,
      layout(
        "New paid order",
        `<p><strong>${escapeHtml(order.customer_name)}</strong> (${escapeHtml(order.email)}, ${escapeHtml(order.phone)}) just paid for:</p>
         ${orderTable(order)}
         <p><strong>${order.delivery_method === "pickup" ? "Pickup address:" : "Ship to:"}</strong><br>${addressHtml(order)}</p>
         <p>Open the admin dashboard to manage this order.</p>`
      )
    );
    await logEvent(order.id, `Admin alert sent to ${to}`);
    return true;
  } catch {
    await logEvent(order.id, "Admin alert email failed to send");
    return false;
  }
}

export async function sendShippedNotification(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  const pickup = order.delivery_method === "pickup";
  try {
    await send(
      order.email,
      pickup
        ? `Your Growth Jar is ready for pick up! (${order.reference})`
        : `Your Growth Jar is on its way! (${order.reference})`,
      layout(
        pickup ? "Your Growth Jar is ready for pick up!" : "Your Growth Jar has shipped!",
        pickup
          ? `<p>Hi ${escapeHtml(order.customer_name)},</p>
             <p>Good news — your Growth Jar is ready for collection. Our sales representative will reach out to confirm your pick-up time and place.</p>
             ${orderTable(order)}
             <p>Keep your order reference safe — you'll need it at collection.</p>
             <p style="color:#a8842c;font-style:italic;">Write it. Tear it. Save it. One week at a time.</p>`
          : `<p>Hi ${escapeHtml(order.customer_name)},</p>
             <p>Good news — your order is on its way to:</p>
             <p><strong>${addressHtml(order)}</strong></p>
             ${orderTable(order)}
             <p>Soon you'll be holding 52 weeks of becoming in your hands. We can't wait for you to begin.</p>
             <p style="color:#a8842c;font-style:italic;">Write it. Tear it. Save it. One week at a time.</p>`
      )
    );
    await logEvent(
      order.id,
      pickup
        ? `Pick-up ready notification emailed to ${order.email}`
        : `Shipped notification emailed to ${order.email}`
    );
    return true;
  } catch {
    await logEvent(order.id, "Shipped notification email failed to send");
    return false;
  }
}

export async function sendNewOrderPendingAlert(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  const to = (await getNotifyEmails()).join(", ");
  if (!to) return false;
  try {
    await send(
      to,
      `New order started: ${order.reference} — awaiting payment`,
      layout(
        "New order — awaiting payment",
        `<p><strong>${escapeHtml(order.customer_name)}</strong> (${escapeHtml(order.email)}, ${escapeHtml(order.phone)}) just started checkout:</p>
         ${orderTable(order)}
         <p><strong>${order.delivery_method === "pickup" ? "Pickup address:" : "Ship to:"}</strong><br>${addressHtml(order)}</p>
         <p>You'll get another email the moment the payment succeeds.</p>`
      )
    );
    await logEvent(order.id, `New-order alert sent to ${to}`);
    return true;
  } catch {
    await logEvent(order.id, "New-order alert email failed to send");
    return false;
  }
}

export async function sendWhatsappOrderAlert(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  const to = (await getNotifyEmails()).join(", ");
  if (!to) return false;
  try {
    await send(
      to,
      `New international order: ${order.reference} — ${usd(order.total_kobo)} (WhatsApp)`,
      layout(
        "New international order — WhatsApp",
        `<p><strong>${escapeHtml(order.customer_name)}</strong> (${escapeHtml(order.email)}, ${escapeHtml(order.phone)}) just saved an international pre-order and is on their way to your WhatsApp:</p>
         ${orderTable(order)}
         <p><strong>Ship to:</strong><br>${addressHtml(order)}</p>
         <p>Payment and delivery are arranged personally in the chat. Once payment is confirmed, open this order in the dashboard and use <strong>Mark as paid</strong>.</p>`
      )
    );
    await logEvent(order.id, `WhatsApp-order alert sent to ${to}`);
    return true;
  } catch {
    await logEvent(order.id, "WhatsApp-order alert email failed to send");
    return false;
  }
}

export async function sendPaymentFailedAlert(order: Order): Promise<boolean> {
  if (!emailConfigured()) return false;
  const to = (await getNotifyEmails()).join(", ");
  if (!to) return false;
  try {
    await send(
      to,
      `Payment failed: ${order.reference}`,
      layout(
        "A payment attempt failed",
        `<p><strong>${escapeHtml(order.customer_name)}</strong> (${escapeHtml(order.email)}, ${escapeHtml(order.phone)}) tried to pay, but the payment did not go through:</p>
         ${orderTable(order)}
         <p>No money was collected. The customer may try again — a new attempt creates a new order reference.</p>`
      )
    );
    await logEvent(order.id, `Payment-failed alert sent to ${to}`);
    return true;
  } catch {
    await logEvent(order.id, "Payment-failed alert email failed to send");
    return false;
  }
}

export async function sendPaymentFailedCustomerEmail(
  order: Order,
  link: string
): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    await send(
      order.email,
      `Your Growth Jar payment didn't go through (${order.reference})`,
      layout(
        "Your payment didn't go through",
        `<p>Hi ${escapeHtml(order.customer_name)},</p>
         <p>Your recent payment attempt for The Growth Jar Experience didn't go through. <strong>No money was taken.</strong> Your order is saved exactly as you left it:</p>
         ${orderTable(order)}
         ${
           order.delivery_method === "pickup"
             ? "<p>You chose pick up — no shipping fee applies, and our sales representative will arrange your collection once payment is confirmed.</p>"
             : "<p>Your Growth Jar will ship to your address after the official launch on 12 December 2026.</p>"
         }
         <p style="margin:24px 0;">
           <a href="${escapeHtml(link)}" style="display:inline-block;background:#414d38;color:#fbf9f4;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Try my payment again</a>
         </p>
         <p>If you've changed your mind, simply ignore this email — nothing will be charged.</p>`
      )
    );
    await logEvent(order.id, `Payment-failed email sent to ${order.email}`);
    return true;
  } catch {
    await logEvent(order.id, "Payment-failed customer email failed to send");
    return false;
  }
}

export async function notifyActivity(opts: {
  subject: string;
  heading: string;
  details: [string, string][];
  actorEmail?: string;
  orderId?: number;
}): Promise<boolean> {
  if (!emailConfigured()) return false;
  const actor = opts.actorEmail?.trim().toLowerCase();
  // Don't email people about their own actions — only what others do.
  const recipients = (await getNotifyEmails()).filter((e) => e !== actor);
  if (recipients.length === 0) return false;
  const to = recipients.join(", ");
  const rows = opts.details
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#6b7060;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  try {
    await send(
      to,
      opts.subject,
      layout(
        opts.heading,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f6f2ea;border-radius:12px;padding:8px 16px;">${rows}</table>
         <p>Open the admin dashboard for full details.</p>`
      )
    );
    if (opts.orderId) await logEvent(opts.orderId, `Activity alert sent to ${to}`);
    return true;
  } catch {
    if (opts.orderId) await logEvent(opts.orderId, "Activity alert email failed to send");
    else await logAdminEvent("System", `Notification email failed: ${opts.subject}`);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  link: string
): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    await send(
      to,
      "Reset your Growth Jar admin password",
      layout(
        "Reset your password",
        `<p>Hi ${escapeHtml(name)},</p>
         <p>We received a request to reset the password for your Growth Jar admin account. Click the button below to choose a new one:</p>
         <p style="margin:24px 0;">
           <a href="${escapeHtml(link)}" style="display:inline-block;background:#414d38;color:#fbf9f4;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Choose a new password</a>
         </p>
         <p>This link expires in <strong>1 hour</strong> and can only be used once. If you didn't request a reset, you can safely ignore this email — your password stays the same.</p>`
      )
    );
    return true;
  } catch {
    return false;
  }
}

export async function sendPaymentReminderEmail(
  order: Order,
  link: string
): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    await send(
      order.email,
      `Your Growth Jar is still waiting (${order.reference})`,
      layout(
        "Your Growth Jar is still waiting",
        `<p>Hi ${escapeHtml(order.customer_name)},</p>
         <p>You started a pre-order for The Growth Jar Experience but the payment wasn't completed. No money was taken, and your order is still saved:</p>
         ${orderTable(order)}
         ${
           order.delivery_method === "pickup"
             ? "<p>You can pick up right where you left off — your package, quantity and pick-up choice are all kept. Pick up carries no shipping fee, and once payment is confirmed our sales representative will arrange your collection.</p>"
             : "<p>You can pick up right where you left off — your package, quantity and delivery details are all kept. Your Growth Jar will ship to you after the official launch on 12 December 2026.</p>"
         }
         <p style="margin:24px 0;">
           <a href="${escapeHtml(link)}" style="display:inline-block;background:#414d38;color:#fbf9f4;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Complete my payment</a>
         </p>
         <p>If you've changed your mind, simply ignore this email — it's the only reminder we'll send, and nothing will be charged.</p>
         <p style="color:#a8842c;font-style:italic;">Don't just count your blessings. Document your becoming.</p>`
      )
    );
    return true;
  } catch {
    await logEvent(order.id, "Payment reminder email failed to send");
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured())
    return { ok: false, error: "SMTP is not configured yet. Add the SMTP values to .env.local first." };
  try {
    await send(
      to,
      "Growth Jar email test",
      layout(
        "Emails are working",
        "<p>This is a test email from your Growth Jar admin dashboard. If you received it, order notifications will reach your customers.</p>"
      )
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed." };
  }
}