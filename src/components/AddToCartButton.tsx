"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/store/cart";
import { useToast } from "./Toaster";

export function AddToCartButton({
  product,
  quantity = 1,
  compact,
}: {
  product: Omit<CartItem, "quantity">;
  quantity?: number;
  compact?: boolean;
}) {
  const add = useCart((s) => s.add);
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleClick() {
    add(product, quantity);
    setAdded(true);
    toast(`${product.name} se agregó al carrito`);
    setTimeout(() => setAdded(false), 1400);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={outOfStock}
        aria-label={outOfStock ? "Sin stock" : `Agregar ${product.name} al carrito`}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-800 text-neon transition hover:border-neon hover:bg-neon hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink-800 disabled:hover:text-neon"
      >
        {added ? <CheckIcon /> : <PlusCartIcon />}
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={outOfStock} className="btn-primary w-full sm:w-auto sm:min-w-56">
      {outOfStock ? "Sin stock" : added ? (<><CheckIcon /> Agregado</>) : (<><PlusCartIcon /> Agregar al carrito</>)}
    </button>
  );
}

function PlusCartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
      <circle cx="10" cy="20.5" r="1" />
      <circle cx="17" cy="20.5" r="1" />
      <path d="M13 10v4M11 12h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
