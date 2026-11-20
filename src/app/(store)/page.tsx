import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getFeaturedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(8), getCategories()]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-700">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-neon/10 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
              <span className="size-1.5 animate-pulse rounded-full bg-neon" /> Nueva temporada · hasta 20% off
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Subile los FPS <br />
              <span className="text-gradient">a tu setup.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-zinc-400">
              Teclados mecánicos, mouses ultralivianos, monitores de alta frecuencia y todo para streamear. Pagá en cuotas con Mercado Pago.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/productos" className="btn-primary">
                Ver productos
              </Link>
              <Link href="/productos?categoria=streaming" className="btn-ghost">
                Armá tu stream
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                ["Envío gratis", "desde $150.000"],
                ["Cuotas", "con Mercado Pago"],
                ["Garantía", "12 meses"],
              ].map(([t, d]) => (
                <div key={t} className="border-l border-ink-600 pl-3">
                  <dt className="font-semibold text-white">{t}</dt>
                  <dd className="text-zinc-500">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {["teclados", "mouses", "auriculares", "monitores"].map((c, i) => (
              <div
                key={c}
                className={`aspect-square overflow-hidden rounded-3xl border border-ink-700 shadow-2xl ${i % 2 ? "translate-y-8" : ""}`}
              >
                <ProductArt seed={`hero-${c}`} category={c} label={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="container-page mt-16">
        <h2 className="font-display text-2xl font-bold text-white">Categorías</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/productos?categoria=${c.slug}`}
              className="group card flex flex-col items-center gap-2 p-4 text-center transition hover:border-neon/50"
            >
              <div className="size-20 overflow-hidden rounded-xl">
                <ProductArt seed={`cat-${c.slug}`} category={c.slug} label={c.name} />
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="container-page mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Destacados</h2>
            <p className="mt-1 text-sm text-zinc-500">Lo más elegido para armar el setup</p>
          </div>
          <Link href="/productos" className="text-sm font-medium text-neon hover:underline">
            Ver todo →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="container-page mt-16">
        <div className="card grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          {[
            ["Pago seguro", "Tus datos de pago los procesa Mercado Pago. Tarjetas, débito o dinero en cuenta."],
            ["Envíos a todo el país", "Despachamos en 24 h hábiles. Seguimiento por mail en cada paso."],
            ["Cambios sin vueltas", "Tenés 30 días para cambiar tu producto si no te convence."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-display font-semibold text-white">{t}</h3>
              <p className="mt-1.5 text-sm text-zinc-400">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
