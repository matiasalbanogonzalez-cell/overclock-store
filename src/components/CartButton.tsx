"use client";

import Link from "next/link";
import { cartCount, useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";

export function CartButton() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link
      href="/carrito"
      className="relative grid size-11 place-items-center rounded-xl border border-ink-700 bg-ink-900 text-zinc-200 transition hover:border-neon/60 hover:text-neon"
      aria-label={`Carrito, ${count} productos`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
        <circle cx="10" cy="20.5" r="1" />
        <circle cx="17" cy="20.5" r="1" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-neon px-1 text-[11px] font-bold text-ink-950">
          {count}
        </span>
      )}
    </Link>
  );
}
