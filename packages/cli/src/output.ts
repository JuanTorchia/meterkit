const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /(?:authorization|bearer.*token|credential|databaseurl|password|paymentheader|paymentproof|privatekey|secret|seed|signature)$/i;

export const CliExitCode = {
  success: 0,
  checkFailed: 1,
  invalidInput: 2,
  environmentUnavailable: 3,
  paymentFailed: 4,
} as const;

export type CliExitCodeValue = (typeof CliExitCode)[keyof typeof CliExitCode];

function normalizedKey(key: string) {
  return key.replaceAll(/[^a-z0-9]/gi, "");
}

export function redactValue(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(normalizedKey(key))) return REDACTED;
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

export function formatJsonEnvelope(command: string, data: unknown) {
  return `${JSON.stringify({
    schemaVersion: 1,
    command,
    data: redactValue(data),
  })}\n`;
}
