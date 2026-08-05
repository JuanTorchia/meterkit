import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payer allowance controls",
  description: "Inspect and revoke bounded Solana agent allowances without giving MeterKit custody.",
  alternates: { canonical: "/agent/allowances" },
  robots: { index: false, follow: false },
};

export default function AllowancesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
