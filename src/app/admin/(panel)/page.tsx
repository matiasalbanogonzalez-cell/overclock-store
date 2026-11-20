import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getDashboard } from "@/lib/admin-data";
import { formatDate, formatPrice, orderCode } from "@/lib/format";
import { SalesChart } from "./SalesChart";

export const metadata = { title: "Resumen · Panel" };

export default async function DashboardPage() {
  const d = await getDashboard();
  const pendingToShip = d.statusCount.PAID ?? 0;

  const stats = [
    { label: "Ventas últimos 30 días", value: formatPrice(d.revenue30), hint: `${d.orders30} ${d.orders30 === 1 ? "pedido pagado" : "pedidos pagados"}` },
    { label: "Ticket promedio", value: formatPrice(d.averageTicket), hint: "últimos 30 días" },
    { label: "Para despachar", value: String(pendingToShip), hint: "pagados sin enviar", href: "/admin/pedidos?estado=PAID" },
    { label: "Esperando pago", value: String(d.statusCount.PENDING ?? 0), hint: "stock reservado", href: "/admin/pedidos?estado=PENDING" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Resumen</h1>
        <p className="text-sm text-zinc-500">Facturación histórica: {formatPrice(d.revenueTotal)} en {d.ordersSold} {d.ordersSold === 1 ? "pedido" : "pedidos"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{s.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-white tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{s.hint}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-5 transition hover:border-neon/40">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card p-5">
          <h2 className="font-display font-semibold text-white">Ventas por día</h2>
          <p className="text-xs text-zinc-500">Últimos 14 días, pedidos pagados</p>
          <SalesChart days={d.days} />
        </section>

        <section className="card p-5">
          <h2 className="font-display font-semibold text-white">Stock bajo</h2>
          {d.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Todo en orden 👌</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/productos/${p.id}`} className="truncate text-zinc-300 hover:text-neon">
                    {p.name}
                  </Link>
                  <span className={`badge ${p.stock === 0 ? "bg-rose-400/10 text-rose-300 ring-rose-400/30" : "bg-amber-400/10 text-amber-300 ring-amber-400/30"}`}>
                    {p.stock === 0 ? "Agotado" : `${p.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-display font-semibold text-white">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm text-neon hover:underline">
            Ver todos →
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-zinc-500">Todavía no hay pedidos. Hacé una compra de prueba desde la tienda.</p>
        ) : (
          <ul className="divide-y divide-ink-700 border-t border-ink-700">
            {d.recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-ink-850">
                  <span className="font-mono text-zinc-300">{orderCode(o.number)}</span>
                  <span className="flex-1 truncate text-zinc-400">{o.customerName}</span>
                  <span className="text-zinc-500">{formatDate(o.createdAt)}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="w-28 text-right font-semibold text-white tabular-nums">{formatPrice(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
