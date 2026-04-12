import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Lora } from "next/font/google";
import Navbar from "@/components/Navbar";
import { TARGET_LANG } from "@/lib/language";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: TARGET_LANG.ui.siteTitle,
  description: TARGET_LANG.ui.siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={TARGET_LANG.htmlLang}
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="au-ambient" aria-hidden="true">
          <div className="au-ambient-center" />
        </div>
        <Navbar />
        <main className="relative z-[1] flex-1">{children}</main>
      </body>
    </html>
  );
}
