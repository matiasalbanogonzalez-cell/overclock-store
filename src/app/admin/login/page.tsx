import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Ingresar al panel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="grid-bg pointer-events-none fixed inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="card relative w-full max-w-sm p-8">
        <Logo />
        <h1 className="mt-6 font-display text-xl font-bold text-white">Panel de administración</h1>
        <p className="mt-1 text-sm text-zinc-500">Ingresá con tu cuenta de admin.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
