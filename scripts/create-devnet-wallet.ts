import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import bs58 from "bs58";
import { createKeyPairSignerFromBytes } from "@solana/kit";

async function main() {
  const output = resolve(process.env.WALLET_OUTPUT ?? ".local-wallets/devnet-payer.json");
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const seed = privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32);
  const publicKeyBytes = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  const secretKey = Uint8Array.from([...seed, ...publicKeyBytes]);
  const signer = await createKeyPairSignerFromBytes(secretKey);
  const expectedAddress = bs58.encode(publicKeyBytes);
  if (signer.address !== expectedAddress) throw new Error("Generated wallet validation failed");

  await mkdir(dirname(output), { recursive: true, mode: 0o700 });
  await writeFile(output, `${JSON.stringify([...secretKey])}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });

  process.stdout.write(`${JSON.stringify({
    network: "solana-devnet-only",
    address: signer.address,
    keypairFile: output,
    warning: "Do not commit, paste, upload, or use this wallet on mainnet.",
  }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
