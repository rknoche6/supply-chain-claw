import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://supply-chain-claw.vercel.app"),
  title: {
    default: "Supply Chain Claw",
    template: "%s | Supply Chain Claw",
  },
  description:
    "Global supply-chain intelligence with country and material drilldowns, compare tools, and source-cited data.",
  keywords: [
    "supply chain",
    "trade deficits",
    "trade surplus",
    "materials",
    "country comparison",
    "import export",
    "raw materials",
  ],
  openGraph: {
    title: "Supply Chain Claw",
    description:
      "Explore source-cited material and country trade intelligence with comparison tools.",
    url: "https://supply-chain-claw.vercel.app",
    siteName: "Supply Chain Claw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supply Chain Claw",
    description: "Source-cited supply-chain and trade intelligence across countries and materials.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader" aria-label="Primary">
          <div className="siteHeaderInner">
            <Link href="/" className="brandBlock" aria-label="Supply Chain Claw home">
              <strong>Supply Chain Claw</strong>
              <span>Global material & trade intelligence</span>
            </Link>

            <nav className="siteNav" aria-label="Main navigation">
              <Link href="/">Explore</Link>
              <Link href="/materials">Materials</Link>
              <Link href="/countries">Countries</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/games/20-questions">Game</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
