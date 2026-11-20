import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-display text-3xl font-bold text-white">Tu carrito</h1>
      <CartView />
    </div>
  );
}
