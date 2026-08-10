import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.MERCHANT_WALLET)
    return NextResponse.json(
      { error: "server_not_configured" },
      { status: 503 },
    );
  return NextResponse.json(
    {
      error: "payment_required",
      network: "solana-devnet",
      integration: "Follow the MeterKit Next adapter guide",
    },
    { status: 402 },
  );
}
