import { canonicalJson, sha256 } from "./model.mjs";

function normalized(graph) {
  return [...graph]
    .map(({ name, version, dependencies = {} }) => ({
      name,
      version,
      dependencies: Object.fromEntries(
        Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)),
      ),
    }))
    .sort((a, b) =>
      `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
    );
}

export function compareArtifactGraph(workspaceGraph, packedGraph) {
  const workspace = normalized(workspaceGraph);
  const packed = normalized(packedGraph);
  return {
    passed: canonicalJson(workspace) === canonicalJson(packed),
    workspaceDigest: sha256(workspace),
    packedDigest: sha256(packed),
    errors:
      canonicalJson(workspace) === canonicalJson(packed)
        ? []
        : [{ code: "PACKED_GRAPH_DRIFT" }],
  };
}
