import "server-only";
import { and, asc, desc, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

export type SortOption = "relevancia" | "menor-precio" | "mayor-precio" | "nuevos";

export async function getCategories() {
  return db.query.categories.findMany({ orderBy: asc(categories.name) });
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    where: and(eq(products.active, true), eq(products.featured, true)),
    with: { category: true },
    orderBy: desc(products.createdAt),
    limit,
  });
}

export async function searchProducts(opts: {
  category?: string;
  q?: string;
  sort?: SortOption;
  inStock?: boolean;
}) {
  const filters: (SQL | undefined)[] = [eq(products.active, true)];

  if (opts.category) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, opts.category) });
    if (!cat) return [];
    filters.push(eq(products.categoryId, cat.id));
  }
  if (opts.q?.trim()) {
    const term = `%${opts.q.trim().replace(/[%_]/g, "\\$&")}%`;
    filters.push(or(ilike(products.name, term), ilike(products.brand, term), ilike(products.description, term)));
  }
  if (opts.inStock) filters.push(gt(products.stock, 0));

  const orderBy = {
    relevancia: [desc(products.featured), desc(gt(products.stock, 0)), asc(products.name)],
    "menor-precio": [asc(products.price)],
    "mayor-precio": [desc(products.price)],
    nuevos: [desc(products.createdAt)],
  }[opts.sort ?? "relevancia"];

  return db.query.products.findMany({
    where: and(...filters),
    with: { category: true },
    orderBy,
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true)),
    with: { category: true },
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  const list = await db.query.products.findMany({
    where: and(eq(products.categoryId, categoryId), eq(products.active, true)),
    with: { category: true },
    orderBy: desc(products.featured),
    limit: limit + 1,
  });
  return list.filter((p) => p.id !== excludeId).slice(0, limit);
}
