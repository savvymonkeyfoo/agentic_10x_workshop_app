import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import Link from 'next/link';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic 10x Workshop",
  description: "Neuro-Symbolic Logic Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex justify-between items-center bg-white/50 dark:bg-brand-navy/50 backdrop-blur-md border-b border-white/20 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white font-bold text-lg">
              10x
            </div>
            <span className="font-bold text-brand-navy dark:text-white tracking-tight">Agentic Protocol</span>
          </Link>
          <div className="flex items-center gap-4">
            <div id="workshop-header-portal"></div>
            <ThemeToggle />
          </div>
        </nav>
        <div className="pt-20"> {/* Offset for fixed nav */}
          {children}
        </div>
      </body>
    </html>
  );
}
