import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, searchProducts, type SortOption } from "@/lib/catalog";

export const metadata: Metadata = { title: "Productos" };

const SORTS: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevancia" },
  { value: "menor-precio", label: "Menor precio" },
  { value: "mayor-precio", label: "Mayor precio" },
  { value: "nuevos", label: "Más nuevos" },
];

type Search = { categoria?: string; q?: string; orden?: string; stock?: string };

function buildHref(current: Search, patch: Partial<Search>) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/productos?${qs}` : "/productos";
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const sort = (SORTS.find((s) => s.value === sp.orden)?.value ?? "relevancia") as SortOption;
  const [categories, list] = await Promise.all([
    getCategories(),
    searchProducts({ category: sp.categoria, q: sp.q, sort, inStock: sp.stock === "1" }),
  ]);
  const current = categories.find((c) => c.slug === sp.categoria);
  const title = sp.q ? `Resultados para “${sp.q}”` : (current?.name ?? "Todos los productos");

  return (
    <div className="container-page py-10">
      <nav className="text-sm text-zinc-500" aria-label="Migas de pan">
        <Link href="/" className="hover:text-white">Inicio</Link> / <span className="text-zinc-300">Productos</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {list.length} {list.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <form className="flex flex-wrap items-center gap-3" action="/productos">
          {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" name="stock" value="1" defaultChecked={sp.stock === "1"} className="size-4 accent-[var(--color-neon)]" />
            Solo con stock
          </label>
          <select name="orden" defaultValue={sort} className="input w-auto py-2" aria-label="Ordenar por">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button className="btn-ghost py-2">Aplicar</button>
        </form>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link
          href={buildHref(sp, { categoria: undefined })}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${!sp.categoria ? "border-neon bg-neon/10 text-neon" : "border-ink-600 text-zinc-400 hover:text-white"}`}
        >
          Todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(sp, { categoria: c.slug })}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${sp.categoria === c.slug ? "border-neon bg-neon/10 text-neon" : "border-ink-600 text-zinc-400 hover:text-white"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card mt-8 p-12 text-center">
          <p className="font-display text-lg text-white">No encontramos productos</p>
          <p className="mt-1 text-sm text-zinc-500">Probá con otra búsqueda o categoría.</p>
          <Link href="/productos" className="btn-ghost mt-6">
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
