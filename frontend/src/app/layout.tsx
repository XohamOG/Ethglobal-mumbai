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
      <body className="min-h-screen bg-[#090a0f] text-[#ededed] antialiased selection:bg-blue-500/20 selection:text-blue-300">
        {children}
      </body>
    </html>
  );
}
