import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Supply Chain Claw",
  description: "Open map + datasets for global supply chains",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
