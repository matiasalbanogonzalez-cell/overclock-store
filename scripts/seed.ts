import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { adminUsers, categories, products, type ProductSpec } from "../src/db/schema";

const categoryList = [
  { slug: "teclados", name: "Teclados" },
  { slug: "mouses", name: "Mouses" },
  { slug: "auriculares", name: "Auriculares" },
  { slug: "monitores", name: "Monitores" },
  { slug: "streaming", name: "Streaming" },
  { slug: "accesorios", name: "Accesorios" },
];

type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  description: string;
  specs: ProductSpec[];
};

// Marcas y productos ficticios para la demo
const productList: SeedProduct[] = [
  {
    slug: "volt-k75-pro",
    name: "Teclado mecánico K75 Pro",
    brand: "Volt",
    category: "teclados",
    price: 129999,
    compareAtPrice: 154999,
    stock: 14,
    featured: true,
    description:
      "Formato 75% con perilla de volumen, switches hot-swap y montaje gasket para un tipeo suave y silencioso. RGB por tecla configurable sin instalar software.",
    specs: [
      { label: "Formato", value: "75% (82 teclas)" },
      { label: "Switches", value: "Lineales Red, hot-swap" },
      { label: "Conexión", value: "USB-C / 2.4 GHz / Bluetooth" },
      { label: "Batería", value: "4000 mAh" },
    ],
  },
  {
    slug: "volt-k60-mini",
    name: "Teclado K60 Mini 60%",
    brand: "Volt",
    category: "teclados",
    price: 74999,
    stock: 22,
    featured: true,
    description:
      "Compacto, liviano y pensado para escritorios con poco espacio. Keycaps PBT double-shot que no se gastan y cable USB-C desmontable.",
    specs: [
      { label: "Formato", value: "60% (61 teclas)" },
      { label: "Switches", value: "Táctiles Brown" },
      { label: "Keycaps", value: "PBT double-shot" },
      { label: "Conexión", value: "USB-C cableado" },
    ],
  },
  {
    slug: "nexa-tkl-optic",
    name: "Teclado TKL Optic",
    brand: "Nexa",
    category: "teclados",
    price: 98999,
    stock: 3,
    description:
      "Switches ópticos con actuación de 1,2 mm y polling rate de 8000 Hz para jugar competitivo. Incluye reposamuñecas magnético.",
    specs: [
      { label: "Formato", value: "TKL (87 teclas)" },
      { label: "Switches", value: "Ópticos lineales" },
      { label: "Polling rate", value: "8000 Hz" },
      { label: "Extras", value: "Reposamuñecas magnético" },
    ],
  },
  {
    slug: "kairo-viper-x",
    name: "Mouse Viper X Wireless",
    brand: "Kairo",
    category: "mouses",
    price: 89999,
    compareAtPrice: 109999,
    stock: 18,
    featured: true,
    description:
      "Solo 58 gramos, sensor óptico de 26.000 DPI y hasta 90 horas de batería. Diseño simétrico para agarre claw o palm.",
    specs: [
      { label: "Peso", value: "58 g" },
      { label: "Sensor", value: "Óptico 26.000 DPI" },
      { label: "Batería", value: "Hasta 90 h" },
      { label: "Conexión", value: "2.4 GHz / USB-C" },
    ],
  },
  {
    slug: "kairo-rush-m1",
    name: "Mouse Rush M1",
    brand: "Kairo",
    category: "mouses",
    price: 29999,
    stock: 40,
    featured: true,
    description:
      "El mouse gamer de entrada que no se queda corto: sensor de 12.000 DPI, 6 botones programables y cable paracord flexible.",
    specs: [
      { label: "Peso", value: "72 g" },
      { label: "Sensor", value: "Óptico 12.000 DPI" },
      { label: "Botones", value: "6 programables" },
      { label: "Cable", value: "Paracord 1,8 m" },
    ],
  },
  {
    slug: "nexa-orbit-mmo",
    name: "Mouse Orbit MMO",
    brand: "Nexa",
    category: "mouses",
    price: 54999,
    stock: 9,
    description:
      "12 botones laterales para MMO y MOBA, peso ajustable y rueda con giro libre. Ideal para juegos con muchas habilidades.",
    specs: [
      { label: "Botones", value: "18 programables" },
      { label: "Sensor", value: "Óptico 18.000 DPI" },
      { label: "Peso", value: "Ajustable 95–115 g" },
      { label: "Conexión", value: "USB cableado" },
    ],
  },
  {
    slug: "sonik-h7-wireless",
    name: "Auriculares H7 Wireless",
    brand: "Sonik",
    category: "auriculares",
    price: 149999,
    compareAtPrice: 179999,
    stock: 11,
    featured: true,
    description:
      "Sonido envolvente 7.1, drivers de 50 mm y micrófono desmontable con cancelación de ruido. Almohadillas viscoelásticas para sesiones largas.",
    specs: [
      { label: "Drivers", value: "50 mm" },
      { label: "Sonido", value: "Envolvente 7.1" },
      { label: "Batería", value: "Hasta 40 h" },
      { label: "Micrófono", value: "Desmontable con cancelación" },
    ],
  },
  {
    slug: "sonik-h3",
    name: "Auriculares H3",
    brand: "Sonik",
    category: "auriculares",
    price: 45999,
    stock: 25,
    description:
      "Livianos, cómodos y compatibles con PC, consolas y celular por jack 3,5 mm. Micrófono flexible con muteo rápido.",
    specs: [
      { label: "Drivers", value: "40 mm" },
      { label: "Conexión", value: "Jack 3,5 mm" },
      { label: "Peso", value: "240 g" },
      { label: "Compatibilidad", value: "PC, PS5, Xbox, Switch" },
    ],
  },
  {
    slug: "pixelon-27q-180",
    name: 'Monitor 27" QHD 180 Hz',
    brand: "Pixelon",
    category: "monitores",
    price: 459999,
    compareAtPrice: 529999,
    stock: 6,
    featured: true,
    description:
      "Panel IPS de 27 pulgadas, 2560×1440, 180 Hz y 1 ms. Colores precisos con 95% DCI-P3 y soporte con altura regulable.",
    specs: [
      { label: "Tamaño", value: '27"' },
      { label: "Resolución", value: "2560 × 1440 (QHD)" },
      { label: "Frecuencia", value: "180 Hz / 1 ms" },
      { label: "Panel", value: "IPS, 95% DCI-P3" },
    ],
  },
  {
    slug: "pixelon-24f-165",
    name: 'Monitor 24" FHD 165 Hz',
    brand: "Pixelon",
    category: "monitores",
    price: 239999,
    stock: 12,
    featured: true,
    description:
      "La puerta de entrada a las altas tasas de refresco: 165 Hz, FreeSync Premium y bordes finos para armar un setup de doble monitor.",
    specs: [
      { label: "Tamaño", value: '24"' },
      { label: "Resolución", value: "1920 × 1080 (FHD)" },
      { label: "Frecuencia", value: "165 Hz / 1 ms" },
      { label: "Sincronización", value: "FreeSync Premium" },
    ],
  },
  {
    slug: "wave-mic-pro",
    name: "Micrófono Wave Pro USB",
    brand: "Wave",
    category: "streaming",
    price: 119999,
    stock: 8,
    featured: true,
    description:
      "Micrófono de condensador cardioide con brazo articulado, filtro antipop y muteo táctil. Calidad de estudio por USB-C, sin placa externa.",
    specs: [
      { label: "Tipo", value: "Condensador cardioide" },
      { label: "Calidad", value: "24 bit / 96 kHz" },
      { label: "Conexión", value: "USB-C" },
      { label: "Incluye", value: "Brazo y filtro antipop" },
    ],
  },
  {
    slug: "wave-cam-4k",
    name: "Webcam Wave Cam 4K",
    brand: "Wave",
    category: "streaming",
    price: 134999,
    stock: 0,
    description:
      "Webcam 4K a 30 fps (o 1080p a 60 fps) con enfoque automático y corrección de luz. Ideal para streaming y videollamadas.",
    specs: [
      { label: "Resolución", value: "4K 30 fps / 1080p 60 fps" },
      { label: "Enfoque", value: "Automático" },
      { label: "Campo de visión", value: "90°" },
      { label: "Conexión", value: "USB-C" },
    ],
  },
  {
    slug: "wave-light-panel",
    name: "Panel de luz LED Wave Light",
    brand: "Wave",
    category: "streaming",
    price: 64999,
    stock: 15,
    description:
      "Luz LED regulable de 2700 K a 6500 K con control desde la app. Se monta en el escritorio y mejora la imagen de cualquier cámara.",
    specs: [
      { label: "Temperatura", value: "2700 K – 6500 K" },
      { label: "Brillo", value: "Regulable 1–100%" },
      { label: "Control", value: "App y botones" },
      { label: "Montaje", value: "Clamp de escritorio" },
    ],
  },
  {
    slug: "grid-pad-xxl",
    name: "Mousepad Grid XXL",
    brand: "Grid",
    category: "accesorios",
    price: 24999,
    stock: 50,
    description:
      "90 × 40 cm para teclado y mouse, superficie de tela speed y base de goma antideslizante. Bordes cosidos que no se deshilachan.",
    specs: [
      { label: "Medidas", value: "90 × 40 cm" },
      { label: "Espesor", value: "4 mm" },
      { label: "Superficie", value: "Tela speed" },
      { label: "Bordes", value: "Cosidos" },
    ],
  },
  {
    slug: "grid-rgb-pad",
    name: "Mousepad Grid RGB",
    brand: "Grid",
    category: "accesorios",
    price: 39999,
    stock: 4,
    description: "Mousepad con borde RGB de 14 efectos y hub USB integrado para conectar el mouse o el headset.",
    specs: [
      { label: "Medidas", value: "80 × 30 cm" },
      { label: "Iluminación", value: "RGB, 14 efectos" },
      { label: "Extras", value: "Hub USB integrado" },
      { label: "Superficie", value: "Tela control" },
    ],
  },
  {
    slug: "nexa-stand-dual",
    name: "Soporte para auriculares Dual",
    brand: "Nexa",
    category: "accesorios",
    price: 32999,
    stock: 20,
    description:
      "Soporte de aluminio con 2 puertos USB 3.0 y salida de audio. Ordena el escritorio y deja el headset siempre a mano.",
    specs: [
      { label: "Material", value: "Aluminio" },
      { label: "Puertos", value: "2 × USB 3.0" },
      { label: "Audio", value: "Jack 3,5 mm" },
      { label: "Base", value: "Antideslizante" },
    ],
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@overclock.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(adminUsers)
    .values({ email, name: "Administrador", passwordHash })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash } });

  const savedCategories = await db
    .insert(categories)
    .values(categoryList)
    .onConflictDoUpdate({ target: categories.slug, set: { name: sql`excluded.name` } })
    .returning();
  const categoryIds = new Map(savedCategories.map((c) => [c.slug, c.id]));

  for (const { category, ...p } of productList) {
    const data = { ...p, featured: p.featured ?? false, categoryId: categoryIds.get(category)! };
    await db.insert(products).values(data).onConflictDoUpdate({ target: products.slug, set: data });
  }

  console.log(`✔ Seed listo: ${categoryList.length} categorías, ${productList.length} productos, admin ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
