import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { listAdminProducts } from "@/lib/admin-data";
import { STORE } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { toggleProductAction } from "../../actions";

export const metadata = { title: "Productos · Panel" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string }> }) {
  const sp = await searchParams;
  const list = await listAdminProducts(sp.q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Productos</h1>
          <p className="text-sm text-zinc-500">{list.length} productos</p>
        </div>
        <div className="flex gap-2">
          <form>
            <input name="q" defaultValue={sp.q} placeholder="Buscar…" className="input w-48" />
          </form>
          <Link href="/admin/productos/nuevo" className="btn-primary py-2">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {sp.ok && <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Producto guardado.</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-ink-700 text-left text-xs tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {list.map((p) => (
              <tr key={p.id} className={p.active ? "hover:bg-ink-850" : "opacity-50 hover:bg-ink-850"}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage image={p.image} seed={p.slug} category={p.category.slug} alt="" sizes="44px" />
                    </div>
                    <div>
                      <Link href={`/admin/productos/${p.id}`} className="font-medium text-zinc-100 hover:text-neon">
                        {p.name}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {p.brand}
                        {p.featured && <span className="ml-2 text-volt">★ Destacado</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.category.name}</td>
                <td className="px-4 py-3 text-right text-white tabular-nums">{formatPrice(p.price)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${p.stock === 0 ? "text-rose-300" : p.stock <= STORE.lowStockThreshold ? "text-amber-300" : "text-zinc-300"}`}>
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <form action={toggleProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      className={`badge cursor-pointer ${p.active ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" : "bg-zinc-400/10 text-zinc-400 ring-zinc-400/30"}`}
                      title={p.active ? "Click para ocultar de la tienda" : "Click para publicar"}
                    >
                      {p.active ? "Publicado" : "Oculto"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/productos/${p.id}`} className="text-neon hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
