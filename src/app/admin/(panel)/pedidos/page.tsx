import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { orderStatus, type OrderStatus } from "@/db/schema";
import { listOrders } from "@/lib/admin-data";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, orderCode } from "@/lib/format";

export const metadata = { title: "Pedidos · Panel" };

type Search = { estado?: string; q?: string; pagina?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = orderStatus.enumValues.includes(sp.estado as OrderStatus) ? (sp.estado as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const { rows, total, pages } = await listOrders({ status, q: sp.q, page });

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ estado: status, q: sp.q, ...patch })) if (v) p.set(k, String(v));
    return `/admin/pedidos${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-zinc-500">{total} pedidos</p>
        </div>
        <form className="flex gap-2">
          {status && <input type="hidden" name="estado" value={status} />}
          <input name="q" defaultValue={sp.q} placeholder="Nombre, email o #número" className="input w-64" />
          <button className="btn-ghost py-2">Buscar</button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[undefined, ...orderStatus.enumValues].map((s) => (
          <Link
            key={s ?? "all"}
            href={href({ estado: s, pagina: undefined })}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${status === s ? "border-neon bg-neon/10 text-neon" : "border-ink-600 text-zinc-400 hover:text-white"}`}
          >
            {s ? ORDER_STATUS_LABEL[s] : "Todos"}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-ink-700 text-left text-xs tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No hay pedidos con estos filtros.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-ink-850">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-mono text-neon hover:underline">
                    {orderCode(o.number)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="text-zinc-200">{o.customerName}</p>
                  <p className="text-xs text-zinc-500">{o.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href({ pagina: String(page - 1) })} className="btn-ghost py-2">← Anterior</Link>}
          <span className="text-zinc-500">Página {page} de {pages}</span>
          {page < pages && <Link href={href({ pagina: String(page + 1) })} className="btn-ghost py-2">Siguiente →</Link>}
        </div>
      )}
    </div>
  );
}
