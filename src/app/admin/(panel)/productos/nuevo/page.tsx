import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Nuevo producto · Panel" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <Link href="/admin/productos" className="text-sm text-zinc-500 hover:text-white">
        ← Productos
      </Link>
      <h1 className="font-display text-2xl font-bold text-white">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
