import type { OrderStatus } from "@/db/schema";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => ars.format(value);

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);

export const orderCode = (number: number) => `#${1000 + number}`;

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente de pago",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REJECTED: "Pago rechazado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  PAID: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  SHIPPED: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  DELIVERED: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
  REJECTED: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
  CANCELLED: "bg-zinc-400/10 text-zinc-300 ring-zinc-400/30",
  EXPIRED: "bg-zinc-400/10 text-zinc-400 ring-zinc-400/30",
};

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
