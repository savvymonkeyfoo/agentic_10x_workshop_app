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
          <Link href="/" className="flex items-center">
            {/* Light mode logo */}
            <img
              src="/logo_transparent.png"
              alt="Agentic 10x Workshop"
              className="h-8 w-auto object-contain dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src="/logo_dark_transparent.png"
              alt="Agentic 10x Workshop"
              className="h-8 w-auto object-contain hidden dark:block"
            />
          </Link>
          <div className="flex items-center gap-4">
            <div id="workshop-header-portal"></div>
            <ThemeToggle />
          </div>
        </nav>
        <div className="pt-20 bg-transparent min-h-screen"> {/* Offset for fixed nav, enforce transparent background */}
          {children}
        </div>
      </body>
    </html>
  );
}
