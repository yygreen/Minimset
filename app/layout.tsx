import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Inter } from "next/font/google";
import "./globals.css";
import { Footer, Header, StickyCta } from "@/components/Chrome";
import { StoreProvider } from "@/lib/store";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";

const frank = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["latin", "hebrew"],
  weight: ["700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FBF8F1",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://4minimset.com"),
  title: {
    default: "Lulav and Etrog Sets, Rav-Inspected | V'samachta Arba Minim",
    template: "%s | V'samachta Arba Minim",
  },
  description:
    "Pre-order a complete lulav and etrog set from Eretz Yisrael: esrog, lulav, hadassim and aravos, sorted by Morei Hora'ah and sealed. Three levels from $45, shipped to your door in time for Yom Tov.",
  openGraph: {
    title: "Lulav and Etrog Sets, Rav-Inspected | V'samachta Arba Minim",
    description:
      "Complete Arba Minim sets from $45, sorted by a Rav in Eretz Yisrael and sealed, delivered to your door before Yom Tov.",
    type: "website",
    siteName: "V'samachta Arba Minim",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "V'samachta Arba Minim: complete lulav and esrog sets from Eretz Yisrael" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${frank.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <StickyCta />
            <CartDrawer />
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
