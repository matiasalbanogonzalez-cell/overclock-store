import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/catalog";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/80 backdrop-blur-xl">
      <div className="bg-gradient-to-r from-neon/15 via-volt/15 to-neon/15 py-1.5 text-center text-xs text-zinc-300">
        Envío gratis en compras desde <strong className="text-white">$150.000</strong> · Pagá con Mercado Pago en cuotas
      </div>
      <div className="container-page flex h-16 items-center gap-4">
        <MobileMenu categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        <Link href="/" aria-label="Overclock, inicio" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Categorías">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/productos?categoria=${c.slug}`}
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-ink-850 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <Suspense>
              <SearchBox />
            </Suspense>
          </div>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
