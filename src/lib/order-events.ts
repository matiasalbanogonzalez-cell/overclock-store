import "server-only";
import type { OrderStatus } from "@/db/schema";
import { sendOrderStatusEmails } from "./mail";
import { applyPayment, getOrderWithItems, type PaymentUpdate } from "./orders";
import { getMpPayment } from "./payments";

/** Aplica un pago y, si el pedido cambió de estado, avisa por mail */
export async function applyPaymentAndNotify(orderId: string, payment: PaymentUpdate) {
  const changed = await applyPayment(orderId, payment);
  if (changed) await notifyStatus(orderId, changed);
  return changed;
}

export async function notifyStatus(orderId: string, status: OrderStatus) {
  const order = await getOrderWithItems(orderId);
  if (order) await sendOrderStatusEmails(order, status);
}

/** Consulta el pago en Mercado Pago y lo aplica al pedido que indica su external_reference */
export async function syncMpPayment(paymentId: string, expectedOrderId?: string) {
  const payment = await getMpPayment(paymentId);
  if (!payment.orderId) return null;
  if (expectedOrderId && payment.orderId !== expectedOrderId) return null;
  return applyPaymentAndNotify(payment.orderId, payment);
}
