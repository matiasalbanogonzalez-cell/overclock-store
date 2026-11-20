import Link from "next/link";
import { STORE } from "@/lib/config";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-700 bg-ink-900/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            Periféricos, monitores y equipo de streaming para armar tu setup. Envíos a todo el país y pagos seguros con Mercado Pago.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white">Tienda</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li><Link className="hover:text-neon" href="/productos">Todos los productos</Link></li>
            <li><Link className="hover:text-neon" href="/productos?orden=nuevos">Novedades</Link></li>
            <li><Link className="hover:text-neon" href="/carrito">Mi carrito</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white">Ayuda</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li><a className="hover:text-neon" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a className="hover:text-neon" href={`mailto:${STORE.email}`}>{STORE.email}</a></li>
            <li>Envío gratis desde $150.000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-700 py-5 text-center text-xs text-zinc-500">
        Tienda demo hecha por Matias González · Next.js, TypeScript, PostgreSQL y Mercado Pago
      </div>
    </footer>
  );
}
