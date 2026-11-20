import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

// El catálogo y el stock cambian seguido: se renderiza en cada request
export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
