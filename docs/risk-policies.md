# Optional payment risk policies

Policies run in declared order before the x402 payment challenge. Each evaluator
has a strict timeout, bounded result, explicit `onError` choice and an `observe`
or `enforce` mode. `warn` blocks only in enforce mode. Observability callbacks
cannot change the payment result.

The Webacy adapter is optional and disabled by default. It sends only the payer
public address and `chain=sol` to the official HTTPS API. It never sends the
requested URL, amount, recipient, transaction, private key or authorization
headers. Configure its key only through `WEBACY_API_KEY` on the server. Deleting
the adapter package and policy entry leaves x402 settlement unchanged.

Scores are fallible third-party signals. Document thresholds, review false
positives and choose fail-open only when service availability outweighs risk.
This feature is not financial advice or a sanctions-compliance guarantee.
