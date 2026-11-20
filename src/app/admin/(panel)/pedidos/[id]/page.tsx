import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, orderCode } from "@/lib/format";
import { allowedTransitions, getOrderWithItems } from "@/lib/orders";
import { changeOrderStatusAction } from "../../../actions";

export const metadata = { title: "Pedido · Panel" };

const ACTION_LABEL = { SHIPPED: "Marcar como enviado", DELIVERED: "Marcar como entregado", CANCELLED: "Cancelar pedido" } as const;

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrderWithItems((await params).id);
  if (!order) notFound();
  const actions = allowedTransitions(order.status);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/pedidos" className="text-sm text-zinc-500 hover:text-white">
        ← Pedidos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Pedido {orderCode(order.number)}</h1>
          <p className="text-sm text-zinc-500">Creado el {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {actions.length > 0 && (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm text-zinc-400">Acciones:</span>
          {actions.map((to) => (
            <form key={to} action={changeOrderStatusAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={to} />
              <button className={to === "CANCELLED" ? "btn-danger py-2" : "btn-primary py-2"}>{ACTION_LABEL[to as keyof typeof ACTION_LABEL] ?? ORDER_STATUS_LABEL[to]}</button>
            </form>
          ))}
          {order.status === "PAID" && <p className="w-full text-xs text-zinc-500">Si cancelás un pedido pagado, el reembolso se hace desde tu cuenta de Mercado Pago.</p>}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="label">Cliente</h2>
          <dl className="space-y-1.5 text-sm">
            <div><dt className="inline text-zinc-500">Nombre: </dt><dd className="inline text-zinc-200">{order.customerName}</dd></div>
            <div><dt className="inline text-zinc-500">Email: </dt><dd className="inline"><a className="text-neon hover:underline" href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></dd></div>
            <div><dt className="inline text-zinc-500">Teléfono: </dt><dd className="inline text-zinc-200">{order.customerPhone}</dd></div>
            <div><dt className="inline text-zinc-500">DNI: </dt><dd className="inline text-zinc-200">{order.customerDni}</dd></div>
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="label">Envío</h2>
          <p className="text-sm leading-relaxed text-zinc-200">
            {order.street}
            <br />
            {order.city}, {order.province} ({order.zipCode})
          </p>
          {order.notes && <p className="mt-3 rounded-lg bg-ink-850 p-3 text-sm text-zinc-400">“{order.notes}”</p>}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="label">Productos</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink-700">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2.5 text-zinc-200">{i.name}</td>
                <td className="py-2.5 text-center text-zinc-400">{formatPrice(i.unitPrice)} × {i.quantity}</td>
                <td className="py-2.5 text-right text-white tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 text-zinc-400" colSpan={2}>Envío</td>
              <td className="py-2.5 text-right text-white">{order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"}</td>
            </tr>
            <tr>
              <td className="py-2.5 font-semibold text-white" colSpan={2}>Total</td>
              <td className="py-2.5 text-right font-display text-lg font-bold text-neon tabular-nums">{formatPrice(order.total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <h2 className="label">Pago</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-zinc-500">ID de pago</dt><dd className="font-mono text-zinc-200">{order.mpPaymentId ?? "—"}</dd></div>
          <div><dt className="text-zinc-500">Pagado el</dt><dd className="text-zinc-200">{order.paidAt ? formatDate(order.paidAt) : "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-zinc-500">Detalle</dt><dd className="text-zinc-200">{order.paymentDetail ?? "—"}</dd></div>
          {order.status === "PENDING" && (
            <div className="sm:col-span-2"><dt className="text-zinc-500">Reserva de stock vence</dt><dd className="text-zinc-200">{formatDate(order.expiresAt)}</dd></div>
          )}
        </dl>
      </section>
    </div>
  );
}
