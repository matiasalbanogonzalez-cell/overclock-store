import { z } from "zod";
import { STORE } from "./config";

export const PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, "Es demasiado largo");

export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(STORE.maxQuantityPerItem),
    }),
  )
  .min(1, "El carrito está vacío")
  .max(30);

export const checkoutSchema = z.object({
  customerName: text(3, 80, "Ingresá tu nombre y apellido"),
  customerEmail: z.string().trim().toLowerCase().email("Ingresá un email válido").max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[\d\s+()-]{8,20}$/, "Ingresá un teléfono válido"),
  customerDni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 números, sin puntos"),
  street: text(4, 120, "Ingresá calle y número"),
  city: text(2, 80, "Ingresá tu localidad"),
  province: z.enum(PROVINCES, { message: "Elegí una provincia" }),
  zipCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/, "Código postal inválido"),
  notes: z.string().trim().max(300).optional().transform((v) => v || null),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartLine = z.infer<typeof cartLinesSchema>[number];
