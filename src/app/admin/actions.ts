"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { products, type OrderStatus, type ProductSpec } from "@/db/schema";
import { login, logout, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { notifyStatus } from "@/lib/order-events";
import { changeOrderStatus } from "@/lib/orders";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage";

// ─── Sesión ──────────────────────────────────────────────────

export async function loginAction(_prev: { error?: string; email?: string }, formData: FormData): Promise<{ error?: string; email?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña.", email };

  const result = await login(email, password);
  if (!result.ok) return { error: result.error, email };

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ─── Productos ───────────────────────────────────────────────

const productSchema = z
  .object({
    name: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
    slug: z.string().trim().max(80).optional(),
    brand: z.string().trim().min(1, "Ingresá la marca").max(60),
    description: z.string().trim().min(10, "Mínimo 10 caracteres").max(2000),
    price: z.coerce.number().int("Sin centavos").positive("Debe ser mayor a 0").max(100_000_000),
    compareAtPrice: z
      .union([z.literal(""), z.coerce.number().int().positive()])
      .transform((v) => (v === "" ? null : v)),
    stock: z.coerce.number().int("Número entero").min(0, "No puede ser negativo").max(100_000),
    categoryId: z.string().min(1, "Elegí una categoría"),
    images: z
      .string()
      .default("[]")
      .transform((v, ctx) => {
        try {
          return JSON.parse(v) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "Fotos inválidas" });
          return z.NEVER;
        }
      })
      .pipe(
        z
          .array(
            z
              .string()
              .max(500)
              // Solo links https o archivos subidos al propio sitio
              .regex(/^(https:\/\/\S+|\/uploads\/productos\/[\w-]+\.(jpg|png|webp|avif))$/, "Hay una foto con un link inválido"),
          )
          .max(MAX_IMAGES_PER_PRODUCT, `Máximo ${MAX_IMAGES_PER_PRODUCT} fotos`),
      ),
    specs: z.string().max(3000).default(""),
    featured: z.boolean(),
    active: z.boolean(),
  })
  .refine((d) => d.compareAtPrice === null || d.compareAtPrice > d.price, {
    message: "El precio anterior tiene que ser mayor al actual",
    path: ["compareAtPrice"],
  });

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

/** "Clave: valor" por línea → [{ label, value }] */
function parseSpecs(text: string): ProductSpec[] {
  return text
    .split("\n")
    .map((line) => line.split(/:(.*)/s).map((s) => s?.trim()))
    .filter(([label, value]) => label && value)
    .slice(0, 20)
    .map(([label, value]) => ({ label: label!.slice(0, 40), value: value!.slice(0, 120) }));
}

export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  // Se devuelven los valores cargados para no perderlos si hay errores
  const values = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]));

  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Revisá los campos marcados.", fieldErrors, values };
  }

  const { specs, slug: rawSlug, ...data } = parsed.data;
  const slug = slugify(rawSlug || data.name);
  if (!slug) return { fieldErrors: { slug: "Slug inválido" }, values };

  const clash = await db.query.products.findFirst({
    where: id ? and(eq(products.slug, slug), ne(products.id, id)) : eq(products.slug, slug),
  });
  if (clash) return { fieldErrors: { slug: "Ya existe un producto con este slug" }, values };

  // La primera foto es la portada que se usa en las tarjetas de la tienda
  const row = { ...data, slug, specs: parseSpecs(specs), image: data.images[0] ?? null };
  if (id) {
    await db.update(products).set(row).where(eq(products.id, id));
  } else {
    await db.insert(products).values(row);
  }

  revalidatePath("/", "layout");
  redirect("/admin/productos?ok=1");
}

export async function toggleProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return;
  await db.update(products).set({ active: !product.active }).where(eq(products.id, id));
  revalidatePath("/", "layout");
}

// ─── Pedidos ─────────────────────────────────────────────────

export async function changeOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const to = String(formData.get("status")) as OrderStatus;
  await changeOrderStatus(id, to);
  if (to === "SHIPPED") await notifyStatus(id, to);
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");
}
