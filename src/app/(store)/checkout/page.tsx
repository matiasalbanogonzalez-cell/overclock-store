import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { paymentsMode } from "@/lib/config";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-2 font-display text-3xl font-bold text-white">Finalizar compra</h1>
      <p className="mb-8 text-sm text-zinc-500">Completá tus datos y te llevamos a Mercado Pago para pagar de forma segura.</p>
      <CheckoutForm demo={paymentsMode() === "demo"} />
    </div>
  );
}
