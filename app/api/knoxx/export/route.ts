import { requirePermission } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getAllOrders, ordersToPdf, ordersToXlsx } from "@/lib/export";

export async function GET(request: Request) {
  await requirePermission("orders.export");
  if (!rateLimit(`export:${clientIp(request.headers)}`, 10, 60_000))
    return new Response("Too many exports. Wait a minute.", { status: 429 });

  const format = new URL(request.url).searchParams.get("format");
  const orders = getAllOrders();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "xlsx") {
    const buffer = await ordersToXlsx(orders);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="growth-jar-orders-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    const buffer = await ordersToPdf(orders);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="growth-jar-orders-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response("Unknown format. Use ?format=xlsx or ?format=pdf.", {
    status: 400,
  });
}