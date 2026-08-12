import { createRequire } from "node:module";

// What is actually running, reported by the process itself.
//
// `{"status":"ok"}` is true of a container serving code from days ago, which is
// how a stale gateway stayed invisible from outside while the site it backs had
// already moved on. `startedAt` costs nothing and settles that on its own: a
// start time older than the change you are looking for means the change is not
// deployed. `commit` is richer but needs a build argument, so it is optional and
// absent rather than guessed.
const startedAt = new Date().toISOString();

function releaseVersion(): string | undefined {
  try {
    // The published package that ships with this build, read from the bundle
    // rather than from the workspace, so it describes the artifact and not
    // the checkout it was built from.
    const require = createRequire(import.meta.url);
    const manifest = require("@usemeterkit/core/package.json") as {
      version?: string;
    };
    return manifest.version;
  } catch {
    return undefined;
  }
}

const version = releaseVersion();

function commitSha(): string | undefined {
  const raw =
    process.env.SOURCE_COMMIT ??
    process.env.GIT_COMMIT_SHA ??
    process.env.COMMIT_SHA;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed.slice(0, 7) : undefined;
}

export function buildIdentity() {
  const commit = commitSha();
  return {
    startedAt,
    ...(version ? { version } : {}),
    ...(commit ? { commit } : {}),
  };
}
