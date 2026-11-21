import "server-only";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { getDb, type Order } from "./db";
import { formatDate, naira, PACKAGE_LABELS } from "./format";

export function getAllOrders(): Order[] {
  return getDb().prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[];
}

const COLUMNS = [
  "Reference",
  "Date",
  "Customer",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "Package",
  "Qty",
  "Unit price",
  "Shipping",
  "Total",
  "Payment",
  "Paid at",
  "Fulfillment",
  "Notes",
];

function orderRow(o: Order): (string | number)[] {
  return [
    o.reference,
    formatDate(o.created_at),
    o.customer_name,
    o.email,
    o.phone,
    o.address_line,
    o.city,
    o.state,
    PACKAGE_LABELS[o.package],
    o.quantity,
    o.unit_price_kobo / 100,
    o.shipping_kobo / 100,
    o.total_kobo / 100,
    o.payment_status,
    o.paid_at ? formatDate(o.paid_at) : "",
    o.fulfillment_status,
    o.notes,
  ];
}

export async function ordersToXlsx(orders: Order[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "The Growth Jar";
  const ws = wb.addWorksheet("Orders");
  ws.addRow(COLUMNS);
  ws.getRow(1).font = { bold: true, color: { argb: "FFFBF9F4" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF414D38" },
  };
  for (const o of orders) ws.addRow(orderRow(o));
  ws.columns.forEach((col, i) => {
    col.width = [14, 22, 24, 30, 16, 36, 16, 16, 34, 6, 12, 12, 12, 10, 22, 12, 40][i] ?? 16;
  });
  ws.getColumn(11).numFmt = "#,##0.00";
  ws.getColumn(12).numFmt = "#,##0.00";
  ws.getColumn(13).numFmt = "#,##0.00";
  ws.autoFilter = { from: "A1", to: "Q1" };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const paid = orders.filter((o) => o.payment_status === "paid");
  const summary = wb.addWorksheet("Summary");
  summary.addRow(["Metric", "Value"]);
  summary.getRow(1).font = { bold: true };
  summary.addRow(["Total orders", orders.length]);
  summary.addRow(["Paid orders", paid.length]);
  summary.addRow(["Revenue (NGN)", paid.reduce((s, o) => s + o.total_kobo, 0) / 100]);
  summary.addRow(["Exported at", formatDate(new Date().toISOString().slice(0, 19).replace("T", " "))]);
  summary.getColumn(1).width = 24;
  summary.getColumn(2).width = 28;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function ordersToPdf(orders: Order[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 36,
      info: { Title: "Growth Jar Orders", Author: "The Growth Jar" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const paid = orders.filter((o) => o.payment_status === "paid");
    const revenue = paid.reduce((s, o) => s + o.total_kobo, 0);

    doc.rect(0, 0, doc.page.width, 70).fill("#414d38");
    doc.fillColor("#fbf9f4").fontSize(20).text("THE GROWTH JAR — ORDER RECORDS", 36, 26);
    doc.fillColor("#3a3f33").fontSize(10);
    doc.text(
      `${orders.length} orders · ${paid.length} paid · Revenue ${naira(revenue)}`,
      36,
      84
    );
    doc.moveDown(1);

    const cols = [
      { label: "Reference", w: 80 },
      { label: "Date", w: 92 },
      { label: "Customer", w: 120 },
      { label: "Package", w: 130 },
      { label: "Total", w: 70 },
      { label: "Payment", w: 55 },
      { label: "Fulfillment", w: 65 },
      { label: "Ship to", w: 158 },
    ];
    const startX = 36;
    const rowH = 26;

    const drawHeader = (y: number) => {
      doc.rect(startX, y, cols.reduce((s, c) => s + c.w, 0), 20).fill("#8b9a7d");
      let x = startX + 4;
      doc.fillColor("#fbf9f4").fontSize(8);
      for (const c of cols) {
        doc.text(c.label.toUpperCase(), x, y + 6, { width: c.w - 8 });
        x += c.w;
      }
      return y + 20;
    };

    let y = drawHeader(110);
    doc.fontSize(8);
    orders.forEach((o, i) => {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = drawHeader(36);
        doc.fontSize(8);
      }
      if (i % 2 === 0)
        doc.rect(startX, y, cols.reduce((s, c) => s + c.w, 0), rowH).fill("#f6f2ea");
      const cells = [
        o.reference,
        formatDate(o.created_at),
        `${o.customer_name}\n${o.email}`,
        `${PACKAGE_LABELS[o.package]} x${o.quantity}`,
        naira(o.total_kobo),
        o.payment_status,
        o.fulfillment_status,
        `${o.address_line}, ${o.city}, ${o.state}`,
      ];
      let x = startX + 4;
      doc.fillColor("#3a3f33");
      cells.forEach((cell, ci) => {
        doc.text(String(cell), x, y + 4, { width: cols[ci].w - 8, height: rowH - 6, ellipsis: true });
        x += cols[ci].w;
      });
      y += rowH;
    });

    doc.end();
  });
}