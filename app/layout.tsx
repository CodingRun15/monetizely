import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Monetizely Quoting Tool",
  description: "Set up a pricing catalog and build customer quotes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-rule bg-paper/80 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-5">
            <Link href="/" className="font-display text-lg tracking-tight text-ink">
              Monetizely
            </Link>
            <div className="h-4 w-px bg-rule" aria-hidden />
            <Link
              href="/catalog"
              className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-emerald"
            >
              Catalog
            </Link>
            <Link
              href="/quotes/new"
              className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-emerald"
            >
              New Quote
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
        <footer className="border-t border-rule px-6 py-4 text-center text-[11px] tracking-wide text-ink-soft">
          Monetizely — quotes, transparently calculated.
        </footer>
      </body>
    </html>
  );
}
