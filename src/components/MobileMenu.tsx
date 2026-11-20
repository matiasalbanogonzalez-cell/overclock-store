"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SearchBox } from "./SearchBox";

export function MobileMenu({ categories }: { categories: { slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="grid size-11 place-items-center rounded-xl border border-ink-700 bg-ink-900 text-zinc-200"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col gap-6 border-r border-ink-700 bg-ink-900 p-5">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-white">Menú</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="rounded-lg p-2 text-zinc-400 hover:text-white">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <Suspense>
              <SearchBox onDone={() => setOpen(false)} />
            </Suspense>
            <nav className="flex flex-col gap-1" aria-label="Categorías">
              <Link href="/productos" className="rounded-lg px-3 py-2.5 text-zinc-200 hover:bg-ink-800">
                Todos los productos
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/productos?categoria=${c.slug}`} className="rounded-lg px-3 py-2.5 text-zinc-400 hover:bg-ink-800 hover:text-white">
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
