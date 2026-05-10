import type { Metadata } from "next";
import { Jost, Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Between Us — Question Cards",
  description: "A conversation journey for friends, partners, and strangers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(cormorant.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased text-text-main">
        {children}
      </body>
    </html>
  );
}
