import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { Order } from "@/db/schema";
import { paymentsMode, siteUrl, STORE } from "./config";

function mpClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN para usar PAYMENTS_MODE=mercadopago");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10_000 } });
}

type CheckoutItem = { productId: string; name: string; unitPrice: number; quantity: number };

/** Crea el checkout y devuelve la URL a la que hay que mandar al cliente */
export async function createCheckout(order: Order, items: CheckoutItem[]) {
  if (paymentsMode() === "demo") {
    return { url: `/pago-demo/${order.id}`, preferenceId: null };
  }

  const base = siteUrl();
  const isPublic = base.startsWith("https://");
  const lineItems = items.map((i) => ({
    id: i.productId,
    title: i.name,
    quantity: i.quantity,
    unit_price: i.unitPrice,
    currency_id: "ARS",
  }));
  if (order.shippingCost > 0) {
    lineItems.push({ id: "envio", title: "Envío", quantity: 1, unit_price: order.shippingCost, currency_id: "ARS" });
  }

  const [firstName, ...rest] = order.customerName.split(" ");
  const preference = await new Preference(mpClient()).create({
    body: {
      items: lineItems,
      external_reference: order.id,
      payer: {
        name: firstName,
        surname: rest.join(" "),
        email: order.customerEmail,
        identification: { type: "DNI", number: order.customerDni },
      },
      back_urls: {
        success: `${base}/pedido/${order.id}`,
        pending: `${base}/pedido/${order.id}`,
        failure: `${base}/pedido/${order.id}`,
      },
      // Mercado Pago sólo acepta auto_return y webhooks con URLs públicas (https)
      ...(isPublic && { auto_return: "approved", notification_url: `${base}/api/webhooks/mercadopago` }),
      statement_descriptor: STORE.name.toUpperCase(),
      // Sólo medios de acreditación inmediata: el stock queda reservado por poco tiempo
      payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }], installments: 6 },
      expires: true,
      expiration_date_to: order.expiresAt.toISOString(),
    },
    requestOptions: { idempotencyKey: `pref-${order.id}` },
  });

  if (!preference.init_point || !preference.id) throw new Error("Mercado Pago no devolvió el link de pago");
  return { url: preference.init_point, preferenceId: preference.id };
}

/** Consulta un pago en la API de Mercado Pago (la única fuente confiable del estado) */
export async function getMpPayment(paymentId: string) {
  const p = await new Payment(mpClient()).get({ id: paymentId });
  return {
    paymentId: String(p.id),
    orderId: p.external_reference ?? null,
    status: p.status ?? "unknown",
    statusDetail: p.status_detail ?? undefined,
    amount: p.transaction_amount ?? undefined,
  };
}

/**
 * Verifica la firma x-signature de un webhook de Mercado Pago.
 * https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMpSignature(opts: { signature: string | null; requestId: string | null; dataId: string }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return { ok: true, skipped: true };
  if (!opts.signature) return { ok: false };

  const parts = Object.fromEntries(
    opts.signature.split(",").map((kv) => {
      const [k, ...v] = kv.split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  );
  const { ts, v1 } = parts as { ts?: string; v1?: string };
  if (!ts || !v1) return { ok: false };

  const id = /^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId;
  let manifest = `id:${id};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return { ok: a.length === b.length && timingSafeEqual(a, b) };
}
