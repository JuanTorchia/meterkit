# Contract: Dependency Inventory

The collector emits a versioned snapshot per source. The normalizer accepts only
schema-valid snapshots and emits deterministic JSON ordered by finding, artifact
and path identity.

Required guarantees:

- zero records and unavailable source are different states;
- raw provider payloads are not copied into public summaries;
- every source record maps to a finding or a bounded normalization error;
- every finding retains all introducing paths and exact resolved versions;
- direct/transitive and runtime/development/build/template/deployment scopes are
  explicit;
- severity and reachability are independent fields;
- repeated normalization of identical snapshots produces byte-equivalent output
  apart from an explicitly excluded generation timestamp.

The inventory command exits 0 only when required sources were collected and all
records classified, 1 when findings block release, 2 for invalid input/config,
and 3 when required evidence is unavailable.
