import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { StrangerThingsOverlay } from "@/components/ui/StrangerThingsOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — Visual Backend Architecture Platform",
  description: "Design, simulate, and generate real backend architectures visually. Build production-grade Node.js/TypeScript services with drag-and-drop nodes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="stranger"
          enableSystem
          disableTransitionOnChange
        >
          <StrangerThingsOverlay />
          <CustomCursor />
          <div className="fixed z-50 top-4 right-4">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
