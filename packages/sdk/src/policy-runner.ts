import {
  paymentPolicyConfigurationSchema,
  policyDecisionSchema,
  policyEvaluationInputSchema,
  type PaymentPolicyConfiguration,
  type PaymentPolicyEvaluator,
  type PolicyDecision,
  type PolicyEvaluationInput,
} from "@usemeterkit/core";

export type ConfiguredPaymentPolicy = {
  evaluator: PaymentPolicyEvaluator;
  configuration: Partial<PaymentPolicyConfiguration> & Pick<PaymentPolicyConfiguration, "id">;
};

export async function runPaymentPolicies(
  rawInput: PolicyEvaluationInput,
  policies: readonly ConfiguredPaymentPolicy[],
) {
  const input = policyEvaluationInputSchema.parse(rawInput);
  const decisions: PolicyDecision[] = [];
  let allowed = true;

  for (const item of policies) {
    const configuration = paymentPolicyConfigurationSchema.parse(item.configuration);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error("POLICY_TIMEOUT")),
      configuration.timeoutMs,
    );
    let decision: PolicyDecision;
    try {
      decision = policyDecisionSchema.parse(
        await item.evaluator.evaluate(input, controller.signal),
      );
      if (decision.policyId !== configuration.id || item.evaluator.id !== configuration.id) {
        throw new Error("POLICY_ID_MISMATCH");
      }
    } catch (cause) {
      const code = cause instanceof Error && cause.message === "POLICY_TIMEOUT"
        ? "POLICY_TIMEOUT"
        : "POLICY_UNAVAILABLE";
      decision = policyDecisionSchema.parse({
        policyId: configuration.id,
        provider: item.evaluator.id,
        outcome: "error",
        reasonCodes: [code],
        evaluatedAt: new Date().toISOString(),
        onErrorApplied: configuration.onError,
      });
    } finally {
      clearTimeout(timeout);
    }
    decisions.push(decision);
    if (configuration.mode === "enforce") {
      if (decision.outcome === "deny" || decision.outcome === "warn") allowed = false;
      if (decision.outcome === "error" && configuration.onError === "deny") allowed = false;
    }
  }
  return { allowed, decisions } as const;
}
