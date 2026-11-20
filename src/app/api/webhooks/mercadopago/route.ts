import { NextResponse, type NextRequest } from "next/server";
import { syncMpPayment } from "@/lib/order-events";
import { verifyMpSignature } from "@/lib/payments";

/**
 * Webhook de Mercado Pago. MP avisa que un pago cambió; nosotros validamos la firma,
 * consultamos el pago en su API (no confiamos en el body) y actualizamos el pedido.
 */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };

  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Otros tipos de aviso (merchant_order, etc.) no nos interesan: respondemos 200 para que no reintente
  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  const signature = verifyMpSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id") ?? dataId,
  });
  if (!signature.ok) {
    console.warn("[webhook MP] Firma inválida, se descarta el aviso", dataId);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  if (signature.skipped) console.warn("[webhook MP] MP_WEBHOOK_SECRET no configurado: no se valida la firma");

  try {
    const changed = await syncMpPayment(dataId);
    return NextResponse.json({ ok: true, changed });
  } catch (err) {
    // 500 → Mercado Pago reintenta más tarde
    console.error("[webhook MP] Error procesando pago", dataId, err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
