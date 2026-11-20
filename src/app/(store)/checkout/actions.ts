"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { changeOrderStatus, CheckoutError, createOrder, priceCart } from "@/lib/orders";
import { createCheckout } from "@/lib/payments";
import { cartLinesSchema, checkoutSchema, type CartLine } from "@/lib/validation";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

/** Precios y stock actuales para mostrar en el carrito */
export async function refreshCart(lines: CartLine[]) {
  const parsed = cartLinesSchema.safeParse(lines);
  if (!parsed.success) return { items: [] };
  const cart = await priceCart(parsed.data);
  return {
    items: cart.items.map((i) => ({ productId: i.productId, price: i.unitPrice, stock: i.stock, available: i.available })),
  };
}

export async function checkoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries([...formData.entries()].filter(([k]) => k !== "cart").map(([k, v]) => [k, String(v)]));

  let lines: unknown;
  try {
    lines = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    lines = [];
  }
  const cart = cartLinesSchema.safeParse(lines);
  if (!cart.success) return { error: "Tu carrito está vacío o es inválido.", values };

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Revisá los datos marcados.", fieldErrors, values };
  }

  let checkoutUrl: string;
  let orderId: string | null = null;
  try {
    const { order, items } = await createOrder(parsed.data, cart.data);
    orderId = order.id;
    const checkout = await createCheckout(order, items);
    await db
      .update(orders)
      .set({ checkoutUrl: checkout.url, mpPreferenceId: checkout.preferenceId })
      .where(eq(orders.id, order.id));
    checkoutUrl = checkout.url;
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message, values };
    console.error("[checkout]", err);
    // Si el pedido se creó pero Mercado Pago falló, se cancela para liberar el stock
    if (orderId) await changeOrderStatus(orderId, "CANCELLED").catch(() => {});
    return { error: "No pudimos iniciar el pago. Intentá de nuevo en unos minutos.", values };
  }

  redirect(checkoutUrl);
}
