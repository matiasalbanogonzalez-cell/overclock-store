import "server-only";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { orderItems, orders, products, type Order, type OrderStatus } from "@/db/schema";
import { shippingFor, STORE } from "./config";
import type { CartLine, CheckoutInput } from "./validation";

export class CheckoutError extends Error {}

/** Precios y stock reales de los productos del carrito (nunca se confía en el precio del navegador) */
export async function priceCart(lines: CartLine[]) {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const found = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(found.map((p) => [p.id, p]));

  const items = lines.map((l) => {
    const p = byId.get(l.productId);
    const available = !!p && p.active && p.stock > 0;
    return {
      productId: l.productId,
      name: p?.name ?? "Producto no disponible",
      unitPrice: p?.price ?? 0,
      stock: p?.stock ?? 0,
      quantity: l.quantity,
      available,
      enoughStock: available && p!.stock >= l.quantity,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const shippingCost = shippingFor(subtotal);
  return { items, subtotal, shippingCost, total: subtotal + shippingCost };
}

/** Devuelve al stock las unidades de un pedido */
async function restock(tx: Tx, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${it.quantity}` })
      .where(eq(products.id, it.productId));
  }
}

/** Intenta descontar stock de todos los ítems; devuelve false si alguno no alcanza */
async function reserveStock(tx: Tx, lines: { productId: string; quantity: number; name: string }[]) {
  for (const l of lines) {
    const updated = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${l.quantity}` })
      .where(and(eq(products.id, l.productId), eq(products.active, true), gte(products.stock, l.quantity)))
      .returning({ id: products.id });
    if (updated.length === 0) return l.name;
  }
  return null;
}

/** Vence los pedidos impagos cuya reserva expiró y libera su stock */
export async function releaseExpiredOrders() {
  const expired = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "PENDING"), lt(orders.expiresAt, new Date())))
    .limit(50);

  for (const { id } of expired) {
    await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
      if (order?.status !== "PENDING") return;
      await restock(tx, id);
      await tx.update(orders).set({ status: "EXPIRED" }).where(eq(orders.id, id));
    });
  }
  return expired.length;
}

/** Crea el pedido reservando stock, todo en una sola transacción */
export async function createOrder(customer: CheckoutInput, lines: CartLine[]) {
  await releaseExpiredOrders();

  // Une líneas repetidas del mismo producto
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);
  const cart = await priceCart([...merged].map(([productId, quantity]) => ({ productId, quantity })));

  const missing = cart.items.find((i) => !i.enoughStock);
  if (missing) {
    throw new CheckoutError(
      missing.available
        ? `No hay stock suficiente de “${missing.name}” (quedan ${missing.stock}). Actualizá tu carrito.`
        : `“${missing.name}” ya no está disponible. Quitalo del carrito para continuar.`,
    );
  }

  return db.transaction(async (tx) => {
    const failed = await reserveStock(tx, cart.items);
    if (failed) {
      // Otro cliente compró las últimas unidades mientras tanto: el throw deshace la transacción
      throw new CheckoutError(`Se agotó “${failed}” mientras comprabas. Actualizá tu carrito.`);
    }

    const [order] = await tx
      .insert(orders)
      .values({
        ...customer,
        subtotal: cart.subtotal,
        shippingCost: cart.shippingCost,
        total: cart.total,
        expiresAt: new Date(Date.now() + STORE.reservationMinutes * 60_000),
      })
      .returning();

    await tx.insert(orderItems).values(
      cart.items.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        name: i.name,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    );

    return { order, items: cart.items };
  });
}

export type PaymentUpdate = {
  paymentId: string;
  /** Estado de Mercado Pago: approved, pending, in_process, rejected, cancelled, refunded, charged_back */
  status: string;
  statusDetail?: string;
  amount?: number;
};

/**
 * Aplica el resultado de un pago a un pedido. Es idempotente: si llega dos veces
 * el mismo aviso (Mercado Pago reintenta los webhooks), no hace nada la segunda vez.
 * Devuelve el nuevo estado si cambió, para que quien llama mande los mails.
 */
export async function applyPayment(orderId: string, payment: PaymentUpdate): Promise<OrderStatus | null> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error(`Pedido ${orderId} inexistente`);

    const detail = [payment.status, payment.statusDetail].filter(Boolean).join(" · ");
    const released: OrderStatus[] = ["REJECTED", "CANCELLED", "EXPIRED"];

    if (payment.status === "approved") {
      if (!["PENDING", ...released].includes(order.status)) return null; // ya estaba pago

      if (payment.amount !== undefined && Math.round(payment.amount) !== order.total) {
        await tx
          .update(orders)
          .set({ paymentDetail: `⚠ Monto pagado (${payment.amount}) distinto al total. Revisar.`, mpPaymentId: payment.paymentId })
          .where(eq(orders.id, orderId));
        return null;
      }

      let note = detail;
      if (released.includes(order.status)) {
        // El pago llegó después de liberar el stock: se intenta volver a reservarlo
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        const failed = await reserveStock(tx, items);
        if (failed) note = `⚠ Pagado tarde y sin stock de “${failed}”: contactar al cliente / reembolsar`;
      }

      await tx
        .update(orders)
        .set({ status: "PAID", paidAt: new Date(), mpPaymentId: payment.paymentId, paymentDetail: note })
        .where(eq(orders.id, orderId));
      return "PAID";
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      if (order.status !== "PENDING") return null;
      await restock(tx, orderId);
      await tx
        .update(orders)
        .set({ status: "REJECTED", mpPaymentId: payment.paymentId, paymentDetail: detail })
        .where(eq(orders.id, orderId));
      return "REJECTED";
    }

    if (payment.status === "refunded" || payment.status === "charged_back") {
      if (!["PAID", "SHIPPED"].includes(order.status)) return null;
      await tx.update(orders).set({ status: "CANCELLED", paymentDetail: detail }).where(eq(orders.id, orderId));
      return "CANCELLED";
    }

    // pending / in_process / authorized: sólo se registra el detalle
    await tx.update(orders).set({ paymentDetail: detail }).where(eq(orders.id, orderId));
    return null;
  });
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
};

export const allowedTransitions = (status: OrderStatus) => NEXT_STATUS[status] ?? [];

/** Cambio de estado manual desde el panel de admin */
export async function changeOrderStatus(orderId: string, to: OrderStatus) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error("Pedido inexistente");
    if (!allowedTransitions(order.status).includes(to)) {
      throw new Error(`No se puede pasar de ${order.status} a ${to}`);
    }
    if (to === "CANCELLED") await restock(tx, orderId);
    await tx.update(orders).set({ status: to }).where(eq(orders.id, orderId));
    return { ...order, status: to } satisfies Order;
  });
}

export async function getOrderWithItems(orderId: string) {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
}
