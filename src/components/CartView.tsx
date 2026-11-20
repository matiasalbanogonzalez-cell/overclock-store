"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { refreshCart } from "@/app/(store)/checkout/actions";
import { shippingFor, STORE } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cartSubtotal, useCart } from "@/store/cart";
import { ProductImage } from "./ProductImage";
import { QuantityInput } from "./QuantityInput";

export function CartView() {
  const hydrated = useHydrated();
  const { items, setQuantity, remove, sync } = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const synced = useRef(false);

  // Al abrir el carrito, se traen precio y stock reales del servidor
  useEffect(() => {
    if (!hydrated || synced.current || items.length === 0) return;
    synced.current = true;
    const before = JSON.stringify(items.map((i) => [i.productId, i.price, i.quantity]));
    refreshCart(items.map((i) => ({ productId: i.productId, quantity: Math.min(i.quantity, STORE.maxQuantityPerItem) }))).then((res) => {
      sync(res.items);
      const after = JSON.stringify(useCart.getState().items.map((i) => [i.productId, i.price, i.quantity]));
      if (before !== after) setNotice("Actualizamos tu carrito con los precios y el stock de hoy.");
    });
  }, [hydrated, items, sync]);

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="font-display text-xl text-white">Tu carrito está vacío</p>
        <p className="mt-2 text-sm text-zinc-500">Sumá algo para tu setup y volvé por acá.</p>
        <Link href="/productos" className="btn-primary mt-6">
          Ver productos
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const missingForFree = STORE.freeShippingFrom - subtotal;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {notice && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{notice}</p>}
        {items.map((item) => (
          <div key={item.productId} className="card flex gap-4 p-4">
            <Link href={`/productos/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ink-850">
              <ProductImage image={item.image} seed={item.slug} category={item.categorySlug} alt={item.name} sizes="96px" />
            </Link>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs tracking-wider text-neon/80 uppercase">{item.brand}</p>
                <Link href={`/productos/${item.slug}`} className="font-medium text-white hover:text-neon">
                  {item.name}
                </Link>
                <p className="text-sm text-zinc-500">{formatPrice(item.price)} c/u</p>
              </div>
              <div className="flex items-center gap-4">
                <QuantityInput value={item.quantity} max={Math.min(item.stock, STORE.maxQuantityPerItem)} onChange={(n) => setQuantity(item.productId, n)} />
                <p className="w-28 text-right font-display font-semibold text-white">{formatPrice(item.price * item.quantity)}</p>
                <button type="button" onClick={() => remove(item.productId)} aria-label={`Quitar ${item.name}`} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-semibold text-white">Resumen</h2>
        {missingForFree > 0 ? (
          <div>
            <p className="text-sm text-zinc-400">
              Te faltan <strong className="text-white">{formatPrice(missingForFree)}</strong> para el envío gratis
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-gradient-to-r from-neon to-volt" style={{ width: `${Math.min(100, (subtotal / STORE.freeShippingFrom) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-emerald-400">¡Tenés envío gratis! 🎉</p>
        )}
        <dl className="space-y-2 border-t border-ink-700 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Subtotal</dt>
            <dd className="text-white">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Envío</dt>
            <dd className="text-white">{shipping ? formatPrice(shipping) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-700 pt-3 text-base">
            <dt className="font-semibold text-white">Total</dt>
            <dd className="font-display text-xl font-bold text-neon">{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="btn-primary w-full">
          Continuar compra
        </Link>
        <Link href="/productos" className="block text-center text-sm text-zinc-400 hover:text-white">
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
