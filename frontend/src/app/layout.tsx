import type { Metadata } from "next";

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
      <body className="min-h-screen bg-[#090a0f] text-[#ededed] antialiased">
        {children}
      </body>
    </html>
  );
}
