# Validation Quickstart: Dependency Risk Remediation

## Local WSL lane — bounded only

1. Edit schemas, fixtures, policies and candidate manifests.
2. Run syntax checks and only the named parser/classification unit files.
3. Review intended manifest and lockfile delta without regenerating the entire
   graph unless explicitly moved to the server.
4. Never run full install, audit, recursive build/test, Docker, Playwright,
   quickstart matrix or payment E2E locally.

## Server collection lane

On the designated 24 GB server at an exact clean commit/worktree:

1. record OS/runtime/package-manager versions and commit/lockfile digests;
2. collect each advisory/update source independently with availability state;
3. perform a frozen install and generate production/development audit snapshots;
4. generate software inventory and exact workspace/artifact dependency graphs;
5. normalize and classify findings and paths;
6. preserve private raw snapshots separately from sanitized evidence.

An empty provider response is recorded as zero records for that source, not as a
global clean result.

## Candidate remediation lane

For one finding/cohort at a time:

1. record the proposed manifest and expected lockfile delta;
2. apply the smallest supported change;
3. regenerate the graph on the server and reject unrelated movement;
4. prove the affected path is patched, removed or explicitly excepted;
5. run typecheck/unit/build for affected consumers;
6. pack/install exact candidate artifacts and supported generated projects;
7. when the payment boundary is touched, run wrong-policy, finality,
   concurrency, duplicate and restart-replay checks;
8. record rollback and final gate result.

## Release lane

Bind commit, lockfile, inventory and artifact digests into one evidence record.
Run the release gate and publish only its sanitized artifact-scoped summary. A
required unavailable source or server check yields `incomplete`, never `passed`.
