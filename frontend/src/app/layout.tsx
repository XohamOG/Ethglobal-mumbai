import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Provenance Graph — Asset & Dependency Intelligence",
  description: "Decentralized multi-hop dependency provenance and verifiable risk scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#101010] text-[#f3f3f3] antialiased selection:bg-[#ffffff] selection:text-[#101010]">
        {children}
      </body>
    </html>
  );
}
