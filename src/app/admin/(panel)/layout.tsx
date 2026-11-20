import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink-700 bg-ink-900 lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 p-4 lg:flex-col lg:items-stretch lg:gap-8 lg:p-5">
          <Link href="/admin">
            <Logo />
          </Link>
          <AdminNav />
        </div>
        <div className="hidden p-5 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <p className="truncate text-xs text-zinc-500">{admin.email}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="btn-ghost flex-1 px-3 py-2 text-xs">
              Ver tienda
            </Link>
            <form action={logoutAction} className="flex-1">
              <button className="btn-ghost w-full px-3 py-2 text-xs">Salir</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-10">
        {children}
        <form action={logoutAction} className="mt-10 lg:hidden">
          <button className="btn-ghost w-full">Cerrar sesión ({admin.email})</button>
        </form>
      </main>
    </div>
  );
}
