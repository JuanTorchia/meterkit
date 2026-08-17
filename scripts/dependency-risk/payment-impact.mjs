const PAYMENT_PACKAGES = [
  /^@x402\//,
  /^@solana\//,
  /^@usemeterkit\/(sdk|database|core)$/,
];
export const PAYMENT_REGRESSIONS = Object.freeze([
  "wrong-policy",
  "settlement-finality",
  "concurrent-replay",
  "duplicate-proof",
  "restart-replay",
]);

export function requiredPaymentChecks(changedPackages) {
  return changedPackages.some((name) =>
    PAYMENT_PACKAGES.some((pattern) => pattern.test(name)),
  )
    ? [...PAYMENT_REGRESSIONS]
    : [];
}

export function verifyPaymentImpact(changedPackages, outcomes) {
  const required = requiredPaymentChecks(changedPackages);
  const missing = required.filter((name) => outcomes[name] !== "passed");
  return {
    required,
    passed: missing.length === 0,
    errors: missing.map((check) => ({
      code: "PAYMENT_REGRESSION_REQUIRED",
      check,
    })),
  };
}
