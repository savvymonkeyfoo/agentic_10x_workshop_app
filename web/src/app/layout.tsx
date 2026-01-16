import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StyleProvider } from "@/components/providers/style-provider";
import { ThemePicker } from "@/components/settings/ThemePicker";
import Link from 'next/link';
import Image from 'next/image';
import "./globals.css";
import logoLight from '@/assets/images/logo_transparent.png';
import logoDark from '@/assets/images/logo_dark_transparent.png';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

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
    <html lang="en" className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StyleProvider defaultStyle="capgemini">
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex justify-between items-center bg-background/50 backdrop-blur-md border-b border-border">
              <Link href="/" className="flex items-center">
                {/* Light mode logo */}
                <Image
                  src={logoLight}
                  alt="Agentic 10x Workshop"
                  className="h-8 w-auto object-contain dark:hidden"
                  priority
                />
                {/* Dark mode logo */}
                <Image
                  src={logoDark}
                  alt="Agentic 10x Workshop"
                  className="h-8 w-auto object-contain hidden dark:block"
                  priority
                />
              </Link>
              <div className="flex items-center gap-4">
                <div id="workshop-header-portal"></div>
                <ThemePicker />
              </div>
            </nav>
            <div className="pt-20 bg-transparent min-h-screen"> {/* Offset for fixed nav, enforce transparent background */}
              {children}
            </div>
            <Toaster />
          </StyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
