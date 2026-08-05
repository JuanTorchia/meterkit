import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider workspace",
  description: "Create API products and inspect direct USDC payment receipts on Solana devnet.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
