import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { paymentsMode } from "@/lib/config";
import { formatDate, formatPrice, orderCode } from "@/lib/format";
import { syncMpPayment } from "@/lib/order-events";
import { getOrderWithItems } from "@/lib/orders";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_id?: string; collection_id?: string }>;
};

const HEADLINES = {
  PENDING: ["Esperando tu pago", "Todavía no recibimos la confirmación del pago. Si ya pagaste, puede tardar unos segundos."],
  PAID: ["¡Compra confirmada! 🎉", "Recibimos tu pago. Te mandamos un mail con el detalle y te avisamos cuando despachemos."],
  SHIPPED: ["Tu pedido está en camino 🚚", "Ya despachamos tu pedido. Pronto lo vas a tener en tus manos."],
  DELIVERED: ["Pedido entregado ✅", "¡Que lo disfrutes! Gracias por comprar en Overclock."],
  REJECTED: ["El pago no se aprobó", "Mercado Pago rechazó el pago y no se te cobró nada. Podés intentar de nuevo con otro medio."],
  CANCELLED: ["Pedido cancelado", "Este pedido fue cancelado. Si tenés dudas, escribinos."],
  EXPIRED: ["El pedido venció", "Pasó el tiempo de reserva sin recibir el pago, así que liberamos el stock."],
} as const;

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  // Al volver de Mercado Pago se confirma el pago contra su API.
  // Así funciona aunque el webhook no llegue (por ejemplo, corriendo en localhost).
  const paymentId = sp.payment_id ?? sp.collection_id;
  if (paymentId && paymentId !== "null" && paymentsMode() === "mercadopago" && /^\d+$/.test(paymentId)) {
    await syncMpPayment(paymentId, id).catch((err) => console.error("[pedido] No se pudo verificar el pago", err));
  }

  const order = await getOrderWithItems(id);
  if (!order) notFound();

  const [title, text] = HEADLINES[order.status];
  const paid = ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);
  const canPay = order.status === "PENDING" && order.checkoutUrl && order.expiresAt > new Date();

  return (
    <div className="container-page max-w-3xl py-12">
      {paid && <ClearCart />}
      <div className="card overflow-hidden">
        <div className={`h-1.5 ${paid ? "bg-gradient-to-r from-neon to-volt" : order.status === "PENDING" ? "bg-amber-400" : "bg-zinc-600"}`} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              Pedido <span className="font-mono text-zinc-200">{orderCode(order.number)}</span> · {formatDate(order.createdAt)}
            </p>
            <OrderStatusBadge status={order.status} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-zinc-400">{text}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {canPay && (
              <a href={order.checkoutUrl!} className="btn-primary">
                Pagar ahora
              </a>
            )}
            {order.status === "PENDING" && (
              <Link href={`/pedido/${order.id}`} className="btn-ghost">
                Actualizar estado
              </Link>
            )}
            {["REJECTED", "EXPIRED", "CANCELLED"].includes(order.status) && (
              <Link href="/carrito" className="btn-primary">
                Volver al carrito
              </Link>
            )}
            {paid && (
              <Link href="/productos" className="btn-ghost">
                Seguir comprando
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-6 border-t border-ink-700 pt-6 sm:grid-cols-2">
            <div>
              <h2 className="label">Productos</h2>
              <ul className="space-y-2 text-sm">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="text-zinc-300">
                      {i.name} <span className="text-zinc-500">× {i.quantity}</span>
                    </span>
                    <span className="shrink-0 text-white">{formatPrice(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-ink-700 pt-2">
                  <span className="text-zinc-400">Envío</span>
                  <span className="text-white">{order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</span>
                </li>
                <li className="flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-neon">{formatPrice(order.total)}</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="label">Envío a</h2>
              <p className="text-sm leading-relaxed text-zinc-300">
                {order.customerName}
                <br />
                {order.street}
                <br />
                {order.city}, {order.province} ({order.zipCode})
              </p>
              <p className="mt-3 text-sm text-zinc-500">{order.customerEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
