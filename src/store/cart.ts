"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORE } from "@/lib/config";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  image: string | null;
  price: number;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Actualiza precio/stock con los datos reales del servidor */
  sync: (fresh: { productId: string; price: number; stock: number; available: boolean }[]) => void;
};

const clampQty = (qty: number, stock: number) =>
  Math.max(1, Math.min(Math.floor(qty) || 1, stock, STORE.maxQuantityPerItem));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          if (item.stock <= 0) return state;
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i)),
        })),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      sync: (fresh) =>
        set((state) => {
          const byId = new Map(fresh.map((f) => [f.productId, f]));
          return {
            items: state.items.flatMap((i) => {
              const f = byId.get(i.productId);
              if (!f || !f.available || f.stock <= 0) return [];
              return [{ ...i, price: f.price, stock: f.stock, quantity: clampQty(i.quantity, f.stock) }];
            }),
          };
        }),
    }),
    { name: "overclock-cart", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
