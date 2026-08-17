# Contract: Dependency Release Gate

Promotion fails when any of these is true:

- reachable or unknown runtime critical/high finding lacks verified remediation
  or a non-expired approved exception;
- any reported critical/high finding is unclassified;
- a required source or server validation is unavailable;
- lockfile changes exceed the candidate's declared cohort without review;
- distributable and workspace dependency graphs differ without explanation;
- a maintained example and generated template drift on a claimed dependency;
- a payment-boundary dependency changed without the required adversarial suite;
- an exception expired or lost its compensating control;
- artifact, lockfile, inventory and commit digests do not describe one candidate.

Low/moderate or proven-unreachable findings remain visible in the evidence and
may be scheduled without blocking, unless project policy explicitly elevates
their artifact or boundary.

Output is schema-versioned, sanitized and includes one result per rule with a
stable code and evidence reference.
