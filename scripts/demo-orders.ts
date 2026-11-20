/**
 * Genera ventas de ejemplo de los últimos 14 días para que el panel tenga datos
 * (útil para capturas del portfolio). No toca el stock.
 *   npm run db:demo-orders
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { orderItems, orders, products, type OrderStatus } from "../src/db/schema";
import { shippingFor } from "../src/lib/config";

const NAMES = ["Lucía Fernández", "Martín Gómez", "Sofía Rodríguez", "Tomás López", "Valentina Díaz", "Joaquín Martínez", "Camila Pérez", "Bruno Sánchez", "Julieta Romero", "Facundo Álvarez", "Agustina Torres", "Nicolás Ruiz"];
const CITIES: [string, string, string][] = [
  ["CABA", "CABA", "C1414"],
  ["Córdoba", "Córdoba", "X5000"],
  ["Rosario", "Santa Fe", "S2000"],
  ["La Plata", "Buenos Aires", "B1900"],
  ["Mendoza", "Mendoza", "M5500"],
  ["Mar del Plata", "Buenos Aires", "B7600"],
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

async function main() {
  const catalog = await db.select().from(products).where(eq(products.active, true));
  if (catalog.length === 0) throw new Error("Primero corré npm run db:seed");

  let created = 0;
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const perDay = Math.floor(Math.random() * 4) + (daysAgo < 5 ? 1 : 0);
    for (let n = 0; n < perDay; n++) {
      const lines = Array.from({ length: Math.ceil(Math.random() * 2) }, () => ({ p: pick(catalog), qty: Math.random() < 0.8 ? 1 : 2 }));
      const unique = [...new Map(lines.map((l) => [l.p.id, l])).values()];
      const subtotal = unique.reduce((s, l) => s + l.p.price * l.qty, 0);
      const shippingCost = shippingFor(subtotal);
      const date = new Date(Date.now() - daysAgo * 86_400_000 - Math.random() * 10 * 3_600_000);
      const name = pick(NAMES);
      const [city, province, zipCode] = pick(CITIES);
      const status: OrderStatus = daysAgo > 4 ? pick(["DELIVERED", "DELIVERED", "SHIPPED"]) : daysAgo > 1 ? "SHIPPED" : "PAID";

      const [order] = await db
        .insert(orders)
        .values({
          status,
          customerName: name,
          customerEmail: `${name.split(" ")[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}@example.com`,
          customerPhone: "11 5555 0000",
          customerDni: String(30_000_000 + Math.floor(Math.random() * 9_000_000)),
          street: `Calle ${Math.floor(Math.random() * 900) + 100}`,
          city,
          province,
          zipCode,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          mpPaymentId: `DEMO-SEED-${date.getTime()}-${n}`,
          paymentDetail: "approved · accredited (demo)",
          expiresAt: date,
          paidAt: date,
          createdAt: date,
        })
        .returning();
      await db.insert(orderItems).values(unique.map((l) => ({ orderId: order.id, productId: l.p.id, name: l.p.name, unitPrice: l.p.price, quantity: l.qty })));
      created++;
    }
  }
  console.log(`✔ ${created} pedidos de ejemplo creados`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
