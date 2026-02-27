import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Brujula - Pagos Garantizados para Freelancers",
  description:
    "Brujula garantiza tu pago en trabajos remotos: el cliente deposita antes, vos cobras seguro al instante y sin comisiones altas. Escrow programable sobre Stellar.",
};

export const viewport: Viewport = {
  themeColor: "#1a3a5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
