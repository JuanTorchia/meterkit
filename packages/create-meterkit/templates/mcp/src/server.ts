const wallet = process.env.MERCHANT_WALLET;
if (!wallet)
  throw new Error("Set MERCHANT_WALLET to a disposable devnet address");
process.stdout.write(
  JSON.stringify({
    status: 402,
    resource: "mcp://tool/paid_tool",
    network: "solana-devnet",
    payTo: wallet,
    next: "Follow the MeterKit MCP adapter guide",
  }) + "\n",
);
