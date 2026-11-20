import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductImage } from "@/components/ProductImage";
import { ProductPurchase } from "@/components/ProductPurchase";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { STORE } from "@/lib/config";
import { discountPercent, formatPrice } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name, description: product.description.slice(0, 155) };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  const off = discountPercent(product.price, product.compareAtPrice);
  const installment = Math.ceil(product.price / 6);
  const gallery = product.images.length ? product.images : product.image ? [product.image] : [];
  const offBadge = off > 0 ? <span className="absolute top-4 left-4 rounded-lg bg-volt px-3 py-1 text-sm font-bold text-white">-{off}% OFF</span> : null;

  return (
    <div className="container-page py-10">
      <nav className="text-sm text-zinc-500" aria-label="Migas de pan">
        <Link href="/" className="hover:text-white">Inicio</Link> /{" "}
        <Link href={`/productos?categoria=${product.category.slug}`} className="hover:text-white">
          {product.category.name}
        </Link>{" "}
        / <span className="text-zinc-300">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {gallery.length > 0 ? (
          <ProductGallery images={gallery} alt={product.name} badge={offBadge} />
        ) : (
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-ink-700 bg-ink-900">
            <ProductImage image={null} seed={product.slug} category={product.category.slug} alt={product.name} />
            {offBadge}
          </div>
        )}

        <div className="flex flex-col">
          <p className="text-sm font-semibold tracking-wider text-neon uppercase">{product.brand}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{product.name}</h1>

          <div className="mt-6">
            {off > 0 && <p className="text-zinc-500 line-through">{formatPrice(product.compareAtPrice!)}</p>}
            <p className="font-display text-4xl font-bold text-white">{formatPrice(product.price)}</p>
            <p className="mt-1 text-sm text-emerald-400">Hasta 6 cuotas de {formatPrice(installment)} con Mercado Pago</p>
          </div>

          <p className="mt-6 leading-relaxed text-zinc-400">{product.description}</p>

          <div className="mt-6 text-sm">
            {product.stock <= 0 ? (
              <span className="badge bg-zinc-500/10 text-zinc-300 ring-zinc-500/30">Sin stock por ahora</span>
            ) : product.stock <= STORE.lowStockThreshold ? (
              <span className="badge bg-amber-400/10 text-amber-300 ring-amber-400/30">¡Quedan solo {product.stock} unidades!</span>
            ) : (
              <span className="badge bg-emerald-400/10 text-emerald-300 ring-emerald-400/30">En stock · listo para enviar</span>
            )}
          </div>

          <div className="mt-6">
            <ProductPurchase
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                categorySlug: product.category.slug,
                image: product.image,
                price: product.price,
                stock: product.stock,
              }}
            />
          </div>

          <ul className="mt-8 grid gap-3 border-t border-ink-700 pt-6 text-sm text-zinc-400 sm:grid-cols-2">
            <li>🚚 Envío gratis desde {formatPrice(STORE.freeShippingFrom)}</li>
            <li>🛡️ Garantía oficial de 12 meses</li>
            <li>🔒 Pago protegido por Mercado Pago</li>
            <li>↩️ 30 días para cambios</li>
          </ul>

          {product.specs.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-white">Especificaciones</h2>
              <dl className="mt-3 divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-700">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-2 gap-4 bg-ink-900 px-4 py-3 text-sm">
                    <dt className="text-zinc-500">{s.label}</dt>
                    <dd className="text-zinc-200">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold text-white">También te puede interesar</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
