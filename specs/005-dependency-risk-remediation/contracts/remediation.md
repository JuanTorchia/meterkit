# Contract: Remediation Candidate

Each candidate declares:

- finding and exact dependency paths in scope;
- compatibility cohort and affected artifacts;
- one action and from/to version or replacement;
- expected manifest/lockfile delta;
- public-contract, migration and license impact;
- security, compatibility, package and payment checks required;
- rollback procedure and outcome.

A candidate cannot be verified merely because an advisory disappears. The
patched path must be absent or outside the vulnerable range, unexpected graph
movement must be zero, and all required artifact-level checks must pass.

Emergency changes remain isolated from feature work. A no-fix candidate becomes
a `RiskException`, never a successful remediation.
