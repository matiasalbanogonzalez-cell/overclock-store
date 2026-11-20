import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/Toaster";
import { siteUrl } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Overclock · Periféricos y setup gamer", template: "%s · Overclock" },
  description: "Teclados mecánicos, mouses, auriculares, monitores y equipo de streaming. Pagá con Mercado Pago y recibí en todo el país.",
  openGraph: { type: "website", locale: "es_AR", siteName: "Overclock" },
};

export const viewport: Viewport = { themeColor: "#05060a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
