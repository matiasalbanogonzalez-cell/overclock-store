/** Configuración de negocio de la tienda */
export const STORE = {
  name: "Overclock",
  tagline: "Periféricos y setup gamer",
  whatsapp: "5491100000000",
  email: "hola@overclock.com",
  /** Envío gratis desde este subtotal (ARS) */
  freeShippingFrom: 150_000,
  /** Costo de envío a todo el país (ARS) */
  shippingCost: 8_500,
  /** Minutos que se reserva el stock mientras el cliente paga */
  reservationMinutes: 30,
  /** Máximo de unidades por producto en un pedido */
  maxQuantityPerItem: 10,
  lowStockThreshold: 5,
} as const;

export function shippingFor(subtotal: number) {
  return subtotal >= STORE.freeShippingFrom || subtotal === 0 ? 0 : STORE.shippingCost;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export type PaymentsMode = "demo" | "mercadopago";

export function paymentsMode(): PaymentsMode {
  return process.env.PAYMENTS_MODE === "mercadopago" ? "mercadopago" : "demo";
}
