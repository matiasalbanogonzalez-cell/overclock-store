import Link from "next/link";
import type { Category, Product } from "@/db/schema";
import { STORE } from "@/lib/config";
import { discountPercent, formatPrice } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";

export type ProductWithCategory = Product & { category: Category };

export function ProductCard({ product, priority }: { product: ProductWithCategory; priority?: boolean }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-neon/40 hover:shadow-[0_10px_40px_-15px_var(--color-neon)]">
      <Link href={`/productos/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink-850">
        <div className="absolute inset-0 transition duration-500 group-hover:scale-105">
          <ProductImage image={product.image} seed={product.slug} category={product.category.slug} alt={product.name} priority={priority} />
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-md bg-volt px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
          {outOfStock && <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">Sin stock</span>}
          {!outOfStock && product.stock <= STORE.lowStockThreshold && (
            <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
              ¡Últimas {product.stock}!
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-neon/80 uppercase">{product.brand}</p>
          <Link href={`/productos/${product.slug}`} className="mt-1 line-clamp-2 font-display text-base font-semibold text-white hover:text-neon">
            {product.name}
          </Link>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            {off > 0 && <p className="text-xs text-zinc-500 line-through">{formatPrice(product.compareAtPrice!)}</p>}
            <p className="font-display text-xl font-bold text-white">{formatPrice(product.price)}</p>
          </div>
          <AddToCartButton
            compact
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
      </div>
    </article>
  );
}
