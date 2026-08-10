# External pilot evidence and privacy

This document defines the minimum evidence for a MeterKit external pilot. It is
designed to correlate one participant-controlled endpoint, one Solana devnet
settlement, one protected response and one rejected replay without publishing
wallet secrets, private URLs or protected content.

## Evidence chain

The public report must contain:

1. **Endpoint ownership:** the participant confirms that MeterKit was integrated
   into an endpoint or MCP tool they control.
2. **SDK identity:** the `@usemeterkit/sdk` version or full MeterKit Git commit used
   by the host project.
3. **Endpoint fingerprint:** SHA-256 of the canonical endpoint URL.
4. **Policy report:** local `pilot:verify` passed with network, mint, recipient
   and maximum amount all marked `enforced: true`.
5. **Challenge fingerprint:** SHA-256 of the decoded `PAYMENT-REQUIRED` JSON
   captured before payment.
6. **Settlement:** a public Solana Explorer URL containing `cluster=devnet`.
7. **Correlation:** a non-secret request ID, receipt ID or participant-generated
   opaque ID recorded with the paid attempt and response.
8. **Protected outcome:** confirmation that the protected handler returned only
   after settlement.
9. **Replay outcome:** HTTP status/public error code plus confirmation that the
   handler did not execute and the recipient was not paid a second time.

These elements create a structured participant self-report but do not
independently prove endpoint ownership, business demand, production use,
revenue or identity. They support a completed devnet integration claim only.

## Create safe fingerprints

Use a dedicated pilot endpoint with no credentials or sensitive query values.
Hash the exact normalized URL emitted in `pilot-report.json`, including scheme,
host, explicit non-default port, path and any non-sensitive query string.
Never remove or transform fields before hashing: that would create a
fingerprint that cannot be compared with the readiness report. Do not send the
URL to an online hashing service.

```bash
node -e 'const {createHash}=require("node:crypto"); const value=process.argv[1]; process.stdout.write(createHash("sha256").update(value).digest("hex")+"\\n")' \
  'https://your-api.test/premium'
```

For the challenge, decode `PAYMENT-REQUIRED` locally, parse it as JSON and hash a
stable JSON representation. The following command reads the base64 header from
standard input so it does not have to appear in shell history:

```bash
read -r PILOT_PAYMENT_REQUIRED
PILOT_PAYMENT_REQUIRED="$PILOT_PAYMENT_REQUIRED" node -e '
const {createHash}=require("node:crypto");
const parsed=JSON.parse(Buffer.from(process.env.PILOT_PAYMENT_REQUIRED,"base64").toString("utf8"));
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key)=>[key,stable(value[key])]));
  return value;
}
process.stdout.write(createHash("sha256").update(JSON.stringify(stable(parsed))).digest("hex")+"\\n");
'
unset PILOT_PAYMENT_REQUIRED
```

Do not publish the original header. Delete temporary header files after the
fingerprint is recorded.

## Correlation ID

Prefer a request or receipt ID already emitted by the participant's service. If
none exists, generate an opaque ID before the paid attempt:

```bash
node -e 'process.stdout.write(require("node:crypto").randomUUID()+"\\n")'
```

Record it in the participant-controlled request log and response metadata
without placing it inside a wallet secret or payment proof. The same ID should
identify the settled attempt and replay observation. It is not a substitute for
the Explorer transaction.

## What must remain private

Never publish:

- seed phrases, private keys or keypair files;
- `.env` values, bearer/session tokens or wallet signatures used for login;
- `PAYMENT-SIGNATURE`, payment proofs or complete payment headers;
- private endpoint URLs, credentials or sensitive query parameters;
- protected response bodies or customer data;
- internal file paths, logs containing secrets or non-public source;
- mainnet addresses or transactions submitted as pilot evidence.

`pilot-report.json` contains the endpoint URL. Review it locally and do not
attach it when the URL is private. Copy only the safe policy facts and
fingerprints requested by the issue form.

## Public consent

A GitHub issue is public and permanently associates its contents with the
submitter's GitHub handle. The citation selection controls reuse by MeterKit:

- **Aggregate metrics only:** MeterKit may include the result in totals but may
  not name or quote the participant elsewhere.
- **Public handle and result:** MeterKit may link to and cite the issue.
- **Do not cite outside GitHub:** the issue remains public but is excluded from
  external grant, marketing and case-study citations.

If a participant cannot accept a public issue, maintainers may collect private
feedback, but must not describe it as public or independently verifiable
evidence.

## Counting decision

Maintainers count one completed external pilot only when all required fields are
present, the Explorer URL is devnet, the correlation is internally consistent
and the participant confirms endpoint ownership and replay rejection. Record
uncertainty or missing evidence; do not infer it.

Readiness checks, MeterKit-controlled endpoints or wallets, incomplete attempts
and internal synthetic validations remain separate funnel stages.
