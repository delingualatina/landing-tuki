import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import FacebookPixel from "@/components/FacebookPixel";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "¡Descubrí Tu Beneficio Exclusivo! | Rueda de la Suerte",
  description:
    "Girá la Rueda de la Suerte y asegurá tu beneficio garantizado hoy mismo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="bg-[#081b33] text-slate-100 font-sans antialiased overflow-x-hidden">
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
