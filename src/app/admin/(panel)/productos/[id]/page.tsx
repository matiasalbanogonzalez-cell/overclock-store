import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Editar producto · Panel" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([db.query.products.findFirst({ where: eq(products.id, id) }), getCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/productos" className="text-sm text-zinc-500 hover:text-white">
        ← Productos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-white">Editar: {product.name}</h1>
        {product.active && (
          <Link href={`/productos/${product.slug}`} target="_blank" className="text-sm text-neon hover:underline">
            Ver en la tienda ↗
          </Link>
        )}
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
