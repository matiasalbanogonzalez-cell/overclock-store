import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export type ProductSpec = { label: string; value: string };

// ─── Catálogo ────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    description: text("description").notNull(),
    /** Precio en pesos argentinos, entero (sin centavos) */
    price: integer("price").notNull(),
    /** Precio "antes", para mostrar el descuento */
    compareAtPrice: integer("compare_at_price"),
    stock: integer("stock").notNull().default(0),
    /** Foto de portada (= la primera de images). Si no hay, se muestra una ilustración generada */
    image: text("image"),
    /** Todas las fotos del producto, en orden */
    images: jsonb("images").$type<string[]>().notNull().default([]),
    specs: jsonb("specs").$type<ProductSpec[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId, t.active), index("products_featured_idx").on(t.featured, t.active)],
);

// ─── Pedidos ─────────────────────────────────────────────────

export const orderStatus = pgEnum("order_status", [
  "PENDING", // creado, esperando el pago (stock reservado)
  "PAID", // pago aprobado
  "SHIPPED", // despachado
  "DELIVERED", // entregado
  "REJECTED", // pago rechazado (stock liberado)
  "CANCELLED", // cancelado (stock liberado)
  "EXPIRED", // no se pagó a tiempo (stock liberado)
]);

export type OrderStatus = (typeof orderStatus.enumValues)[number];

export const orders = pgTable(
  "orders",
  {
    id: id(),
    /** Número visible para el cliente (#1001, #1002...) */
    number: serial("number").notNull().unique(),
    status: orderStatus("status").notNull().default("PENDING"),

    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerDni: text("customer_dni").notNull(),
    street: text("street").notNull(),
    city: text("city").notNull(),
    province: text("province").notNull(),
    zipCode: text("zip_code").notNull(),
    notes: text("notes"),

    subtotal: integer("subtotal").notNull(),
    shippingCost: integer("shipping_cost").notNull(),
    total: integer("total").notNull(),

    /** URL para pagar (Checkout Pro o simulador demo) */
    checkoutUrl: text("checkout_url"),
    mpPreferenceId: text("mp_preference_id"),
    mpPaymentId: text("mp_payment_id"),
    paymentDetail: text("payment_detail"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_status_expires_idx").on(t.status, t.expiresAt),
    uniqueIndex("orders_mp_payment_idx").on(t.mpPaymentId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    /** Copia del nombre y precio al momento de la compra */
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// ─── Admin ───────────────────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relaciones ──────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({ items: many(orderItems) }));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
