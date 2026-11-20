import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { paymentsMode } from "@/lib/config";
import { formatPrice, orderCode } from "@/lib/format";
import { applyPaymentAndNotify } from "@/lib/order-events";
import { getOrderWithItems } from "@/lib/orders";

export const metadata: Metadata = { title: "Simulador de pago", robots: { index: false } };

async function simulate(formData: FormData) {
  "use server";
  if (paymentsMode() !== "demo") notFound();
  const orderId = String(formData.get("orderId"));
  const result = String(formData.get("result"));
  const order = await getOrderWithItems(orderId);
  if (!order) notFound();

  if (order.status === "PENDING") {
    await applyPaymentAndNotify(orderId, {
      paymentId: `DEMO-${Date.now()}`,
      status: result === "approved" ? "approved" : "rejected",
      statusDetail: result === "approved" ? "accredited (simulado)" : "cc_rejected_insufficient_amount (simulado)",
      amount: order.total,
    });
  }
  redirect(`/pedido/${orderId}`);
}

/** Simulador para probar el flujo completo sin cuenta de Mercado Pago (PAYMENTS_MODE=demo) */
export default async function DemoPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  if (paymentsMode() !== "demo") notFound();
  const order = await getOrderWithItems((await params).id);
  if (!order) notFound();
  if (order.status !== "PENDING") redirect(`/pedido/${order.id}`);

  return (
    <div className="container-page max-w-md py-16">
      <div className="card overflow-hidden">
        <div className="bg-[#009ee3] px-6 py-4 text-white">
          <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Simulador de pago · modo demo</p>
          <p className="mt-1 font-display text-2xl font-bold">{formatPrice(order.total)}</p>
          <p className="text-sm opacity-90">Overclock · Pedido {orderCode(order.number)}</p>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-zinc-400">
            Esta pantalla reemplaza a Mercado Pago mientras la tienda está en modo demo. Elegí cómo termina el pago para probar cada caso.
          </p>
          <form action={simulate} className="grid gap-3">
            <input type="hidden" name="orderId" value={order.id} />
            <button name="result" value="approved" className="btn-primary w-full">
              Aprobar pago
            </button>
            <button name="result" value="rejected" className="btn-danger w-full">
              Rechazar pago
            </button>
          </form>
          <p className="text-center text-xs text-zinc-500">No se cobra nada. Para usar Mercado Pago real, poné PAYMENTS_MODE=mercadopago.</p>
        </div>
      </div>
    </div>
  );
}
