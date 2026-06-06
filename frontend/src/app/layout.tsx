import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rey's Vogue | Premium Fashion & Lifestyle",
  description: "A premium fashion and lifestyle store focused on male wears, female wears, and perfumes.",
};

import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { PromoTicker } from "@/components/promo-ticker";
import { CartSidebar } from "@/components/cart-sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased font-sans flex flex-col min-h-screen`}
      >
        <Providers>
          <PromoTicker />
          <Navbar />
          <CartSidebar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
