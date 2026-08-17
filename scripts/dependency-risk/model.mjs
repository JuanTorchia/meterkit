import { createHash } from "node:crypto";

const SECRET_KEY =
  /(?:authorization|bearer.*token|credential|databaseurl|password|privatekey|secret|seed)$/i;

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  const input = typeof value === "string" ? value : canonicalJson(value);
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

export function stableId(parts) {
  return sha256(parts).slice("sha256:".length, "sha256:".length + 32);
}

function normalizedKey(key) {
  return key.replaceAll(/[^a-z0-9]/gi, "");
}

export function redact(value, key = "") {
  if (SECRET_KEY.test(normalizedKey(key))) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }
  return value;
}
