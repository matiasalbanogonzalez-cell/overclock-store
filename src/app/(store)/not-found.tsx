import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-white">No encontramos esta página</h1>
      <p className="mt-2 text-zinc-500">Puede que el producto ya no esté disponible.</p>
      <Link href="/productos" className="btn-primary mt-8">
        Ir a la tienda
      </Link>
    </div>
  );
}
