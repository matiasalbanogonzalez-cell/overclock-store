import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, type OrderStatus } from "@/db/schema";
import { STORE } from "./config";
import { releaseExpiredOrders } from "./orders";

const SOLD: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

export async function getDashboard() {
  await releaseExpiredOrders();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const since14 = new Date();
  since14.setHours(0, 0, 0, 0);
  since14.setDate(since14.getDate() - 13);

  const [[revenue], [revenue30], byStatus, lowStock, recent, daily] = await Promise.all([
    db.select({ total: sum(orders.total), n: count() }).from(orders).where(inArray(orders.status, SOLD)),
    db
      .select({ total: sum(orders.total), n: count() })
      .from(orders)
      .where(and(inArray(orders.status, SOLD), gte(orders.paidAt, since30))),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.active, true), lte(products.stock, STORE.lowStockThreshold)))
      .orderBy(asc(products.stock))
      .limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db
      .select({
        day: sql<string>`to_char(${orders.paidAt} at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD')`,
        total: sum(orders.total),
      })
      .from(orders)
      .where(and(inArray(orders.status, SOLD), gte(orders.paidAt, since14)))
      .groupBy(sql`1`),
  ]);

  // Completa los días sin ventas con 0
  const totals = new Map(daily.map((d) => [d.day, Number(d.total)]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since14);
    d.setDate(d.getDate() + i);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(d);
    return { day: key, total: totals.get(key) ?? 0 };
  });

  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s.n])) as Partial<Record<OrderStatus, number>>;

  return {
    revenueTotal: Number(revenue.total ?? 0),
    ordersSold: revenue.n,
    revenue30: Number(revenue30.total ?? 0),
    orders30: revenue30.n,
    averageTicket: revenue30.n ? Math.round(Number(revenue30.total) / revenue30.n) : 0,
    statusCount,
    lowStock,
    recent,
    days,
  };
}

export async function listOrders(opts: { status?: OrderStatus; q?: string; page: number }) {
  await releaseExpiredOrders();
  const PAGE = 20;
  const filters = [];
  if (opts.status) filters.push(eq(orders.status, opts.status));
  if (opts.q?.trim()) {
    const q = opts.q.trim().replace(/^#/, "");
    const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const num = /^\d+$/.test(q) ? Number(q) - 1000 : null;
    filters.push(
      or(
        ilike(orders.customerName, term),
        ilike(orders.customerEmail, term),
        ...(num !== null && num > 0 ? [eq(orders.number, num)] : []),
      ),
    );
  }
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(PAGE).offset((opts.page - 1) * PAGE),
    db.select({ n: count() }).from(orders).where(where),
  ]);
  return { rows, total: n, pages: Math.max(1, Math.ceil(n / PAGE)) };
}

export async function listAdminProducts(q?: string) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, "\\$&")}%` : null;
  return db.query.products.findMany({
    where: term ? or(ilike(products.name, term), ilike(products.brand, term)) : undefined,
    with: { category: true },
    orderBy: [desc(products.active), asc(products.name)],
  });
}
