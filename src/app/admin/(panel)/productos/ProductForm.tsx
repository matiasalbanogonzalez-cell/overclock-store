"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/use-form-action";
import type { Category, Product } from "@/db/schema";
import { saveProductAction } from "../../actions";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveProductAction, {});
  const err = (name: string) => state.fieldErrors?.[name];
  // Después de un error se muestran los valores que cargó el usuario; si no, los del producto
  const val = (name: string, fallback?: string | number | null) => state.values?.[name] ?? fallback ?? "";
  const checked = (name: string, fallback: boolean) => (state.values ? state.values[name] === "on" : fallback);

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, defaultValue?: string | number | null) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} defaultValue={val(name, defaultValue)} className={`input ${err(name) ? "border-rose-500/70" : ""}`} {...props} />
      {err(name) && <p className="mt-1 text-xs text-rose-400">{err(name)}</p>}
    </div>
  );

  return (
    <form onSubmit={submitWithoutReset(action)} className="max-w-3xl space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.error && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      )}

      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">{field("name", "Nombre", { required: true }, product?.name)}</div>
        {field("brand", "Marca", { required: true }, product?.brand)}
        <div>
          <label htmlFor="categoryId" className="label">
            Categoría
          </label>
          <select id="categoryId" name="categoryId" defaultValue={val("categoryId", product?.categoryId)} className="input" required>
            <option value="" disabled>
              Elegí una
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {err("categoryId") && <p className="mt-1 text-xs text-rose-400">{err("categoryId")}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">
            Descripción
          </label>
          <textarea id="description" name="description" rows={4} defaultValue={val("description", product?.description)} className={`input ${err("description") ? "border-rose-500/70" : ""}`} required />
          {err("description") && <p className="mt-1 text-xs text-rose-400">{err("description")}</p>}
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-3">
        {field("price", "Precio (ARS)", { type: "number", min: 1, step: 1, required: true }, product?.price)}
        {field("compareAtPrice", "Precio anterior (opcional)", { type: "number", min: 1, step: 1 }, product?.compareAtPrice)}
        {field("stock", "Stock", { type: "number", min: 0, step: 1, required: true }, product?.stock ?? 0)}
      </section>

      <section className="card grid gap-4 p-6">
        {field("image", "URL de imagen (opcional)", { type: "url", placeholder: "https://… — si lo dejás vacío se genera una ilustración" }, product?.image)}
        {field("slug", "Slug / URL del producto", { placeholder: "Se genera solo a partir del nombre" }, product?.slug)}
        <div>
          <label htmlFor="specs" className="label">
            Especificaciones (una por línea, “Nombre: valor”)
          </label>
          <textarea
            id="specs"
            name="specs"
            rows={5}
            defaultValue={val("specs", product?.specs.map((s) => `${s.label}: ${s.value}`).join("\n"))}
            className="input font-mono text-xs"
            placeholder={"Peso: 58 g\nSensor: Óptico 26.000 DPI"}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" name="active" defaultChecked={checked("active", product?.active ?? true)} className="size-4 accent-[var(--color-neon)]" />
            Publicado en la tienda
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" name="featured" defaultChecked={checked("featured", product?.featured ?? false)} className="size-4 accent-[var(--color-neon)]" />
            Destacado en el inicio
          </label>
        </div>
      </section>

      <div className="flex gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar producto"}
        </button>
        <Link href="/admin/productos" className="btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
