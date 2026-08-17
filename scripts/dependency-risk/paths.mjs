import { stableId } from "./model.mjs";

function packageIdentity(node, fallbackName) {
  return {
    name: node.name ?? fallbackName,
    version: node.version ?? "unknown",
  };
}

export function extractDependencyPaths(roots, targetPackageName) {
  const found = [];

  function visit(node, fallbackName, chain, root, seen) {
    if (!node || typeof node !== "object") return;
    const identity = packageIdentity(node, fallbackName);
    const nextChain = [...chain, identity];
    if (identity.name === targetPackageName) {
      found.push({
        rootName: root.name,
        rootPath: root.path,
        packages: nextChain,
      });
    }
    const cycleKey = `${identity.name}@${identity.version}`;
    if (seen.has(cycleKey)) return;
    const nextSeen = new Set(seen).add(cycleKey);
    for (const [dependencyName, dependency] of Object.entries(
      node.dependencies ?? {},
    ).sort(([left], [right]) => left.localeCompare(right))) {
      visit(dependency, dependencyName, nextChain, root, nextSeen);
    }
  }

  for (const root of [...roots].sort((left, right) =>
    (left.path ?? left.name).localeCompare(right.path ?? right.name),
  )) {
    visit(root, root.name, [], root, new Set());
  }
  return found.sort((left, right) =>
    JSON.stringify(left.packages).localeCompare(JSON.stringify(right.packages)),
  );
}

function artifactKind(path, manifest) {
  if (path.includes("/templates/")) return "generated_template";
  if (path.startsWith("apps/")) return "deployed_app";
  if (path.startsWith("examples/")) return "example";
  if (path.startsWith("packages/") && manifest.private !== true) {
    return "public_package";
  }
  return "development_tool";
}

export function manifestArtifact({ path, manifest }) {
  const kind = artifactKind(path, manifest);
  const name = manifest.name ?? path;
  return {
    id: `${kind}-${stableId([path, name])}`,
    kind,
    name,
    ...(manifest.version ? { version: manifest.version } : {}),
    manifestPath: path,
    releaseImpact: kind === "development_tool" ? "scheduled" : "unknown",
  };
}

export function artifactForGraphRoot(root, artifacts) {
  const normalizedRootPath = String(root.path ?? "").replaceAll("\\", "/");
  return artifacts.find(
    (artifact) =>
      artifact.name === root.name ||
      normalizedRootPath.endsWith(
        artifact.manifestPath.replace(/\/package\.json$/, ""),
      ),
  );
}
