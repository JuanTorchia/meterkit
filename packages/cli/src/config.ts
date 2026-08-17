import { stat } from "node:fs/promises";

import { address } from "@solana/kit";

export function parseSolanaAddress(value: string) {
  try {
    return address(value).toString();
  } catch {
    throw new Error("recipient must be a valid Solana public key");
  }
}

export function parsePublicUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("URL must be an absolute HTTP or HTTPS URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("URL must be an absolute HTTP or HTTPS URL");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URL must not contain credentials");
  }
  return parsed;
}

export function parseAtomicLimit(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error("atomic amount must be a positive integer");
  }
  return BigInt(value);
}

export async function assertPrivateFilePermissions(path: string) {
  const metadata = await stat(path);
  if (!metadata.isFile())
    throw new Error("keypair path must be a regular file");
  if (process.platform === "win32") return;
  if ((metadata.mode & 0o077) !== 0) {
    throw new Error("keypair file permissions must be 0600");
  }
}
