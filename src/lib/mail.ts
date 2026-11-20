import "server-only";
import nodemailer from "nodemailer";
import type { Order, OrderItem, OrderStatus } from "@/db/schema";
import { siteUrl, STORE } from "./config";
import { formatPrice, orderCode } from "./format";

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

async function send(to: string, subject: string, html: string) {
  const t = transport();
  if (!t) {
    console.info(`\n[mail · modo consola] Para: ${to}\nAsunto: ${subject}\n`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || `${STORE.name} <no-reply@example.com>`, to, subject, html });
  } catch (err) {
    // Un mail que falla no debe romper la compra: se registra y se sigue
    console.error("[mail] No se pudo enviar:", err);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#05060a;font-family:Arial,Helvetica,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:bold;color:#fff;letter-spacing:-0.5px">OVER<span style="color:#3cf0ff">CLOCK</span></div>
    <div style="margin-top:24px;background:#0f121c;border:1px solid #1f2436;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fff">${title}</h1>
      ${body}
    </div>
    <p style="margin-top:20px;font-size:12px;color:#71717a;text-align:center">${STORE.name} · ${STORE.email}</p>
  </div></body></html>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:8px 0;color:#d4d4d8">${esc(i.name)} × ${i.quantity}</td>
      <td style="padding:8px 0;text-align:right;color:#fff">${formatPrice(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">${rows}
    <tr><td style="padding:8px 0;border-top:1px solid #1f2436;color:#a1a1aa">Envío</td>
      <td style="padding:8px 0;border-top:1px solid #1f2436;text-align:right">${order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#fff">Total</td>
      <td style="padding:8px 0;text-align:right;font-weight:bold;color:#3cf0ff">${formatPrice(order.total)}</td></tr></table>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:8px;background:#3cf0ff;color:#05060a;font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:10px">${label}</a>`;

export async function sendOrderStatusEmails(order: Order & { items: OrderItem[] }, status: OrderStatus) {
  const code = orderCode(order.number);
  const link = `${siteUrl()}/pedido/${order.id}`;
  const name = esc(order.customerName.split(" ")[0]);

  if (status === "PAID") {
    await send(
      order.customerEmail,
      `¡Recibimos tu pago! Pedido ${code}`,
      layout(
        `¡Gracias por tu compra, ${name}!`,
        `<p style="color:#a1a1aa;line-height:1.5">Tu pago fue aprobado. Ya estamos preparando tu pedido <strong style="color:#fff">${code}</strong> y te avisamos cuando salga.</p>
        ${itemsTable(order, order.items)}
        <p style="color:#a1a1aa;font-size:14px">Envío a: ${esc(order.street)}, ${esc(order.city)}, ${esc(order.province)} (${esc(order.zipCode)})</p>
        ${button(link, "Ver mi pedido")}`,
      ),
    );
    const notify = process.env.STORE_NOTIFY_EMAIL;
    if (notify) {
      await send(
        notify,
        `🛒 Nueva venta ${code} · ${formatPrice(order.total)}`,
        layout(`Nueva venta ${code}`, `<p style="color:#a1a1aa">${esc(order.customerName)} · ${esc(order.customerEmail)}</p>${itemsTable(order, order.items)}${button(`${siteUrl()}/admin/pedidos/${order.id}`, "Abrir en el panel")}`),
      );
    }
  }

  if (status === "SHIPPED") {
    await send(
      order.customerEmail,
      `Tu pedido ${code} está en camino 🚚`,
      layout(`¡Tu pedido salió, ${name}!`, `<p style="color:#a1a1aa;line-height:1.5">Despachamos tu pedido <strong style="color:#fff">${code}</strong>. En los próximos días lo vas a recibir en ${esc(order.city)}.</p>${button(link, "Seguir mi pedido")}`),
    );
  }

  if (status === "REJECTED") {
    await send(
      order.customerEmail,
      `No pudimos procesar el pago del pedido ${code}`,
      layout(`Tu pago no se aprobó`, `<p style="color:#a1a1aa;line-height:1.5">Mercado Pago rechazó el pago del pedido ${code}. No se te cobró nada. Podés intentar de nuevo con otro medio de pago.</p>${button(`${siteUrl()}/carrito`, "Volver al carrito")}`),
    );
  }
}
