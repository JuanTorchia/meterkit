// Packs each publishable workspace package and checks that everything its entry
// point imports actually ships inside the tarball.
//
// `packages/pilot` listed its files one by one, so `dist/evidence.js` and
// `dist/activation.js` were never packed even though `dist/index.js` imports
// both. Nothing noticed while pilot was only a workspace CLI. The moment it
// became a dependency of the deployed gateway, the container crashed on startup
// with ERR_MODULE_NOT_FOUND, the platform kept serving the previous image, and
// the route that depended on it 404ed in production while every gate stayed
// green. Typecheck, lint and tests all pass on a package that cannot be
// installed: only packing it reveals the gap.
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function publishablePackages(base) {
  const found = [];
  for (const entry of await readdir(join(base, "packages"), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;
    const path = join(base, "packages", entry.name, "package.json");
    let manifest;
    try {
      manifest = JSON.parse(await readFile(path, "utf8"));
    } catch {
      continue;
    }
    if (manifest.private === true) continue;
    const entryPoint =
      manifest.exports?.["."]?.import ?? manifest.main ?? undefined;
    if (!entryPoint) continue;
    found.push({
      name: manifest.name,
      directory: join(base, "packages", entry.name),
      entryPoint: entryPoint.replace(/^\.\//, ""),
    });
  }
  return found;
}

/** Entries inside a packed tarball, relative to the package root. */
function packedFiles(directory, destination) {
  const output = execFileSync(
    "pnpm",
    ["pack", "--pack-destination", destination],
    { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const tarball = output.trim().split("\n").at(-1).trim();
  const listing = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  return new Set(
    listing
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      // npm packs everything under a `package/` prefix.
      .map((line) => line.replace(/^package\//, "")),
  );
}

/** Relative specifiers an emitted module imports or re-exports. */
function relativeImports(source) {
  const found = new Set();
  for (const [, specifier] of source.matchAll(
    /(?:from|import)\s*["'](\.[^"']+)["']/g,
  )) {
    found.add(specifier);
  }
  return [...found];
}

export async function verifyPackageContents(base = root) {
  const failures = [];
  const packages = await publishablePackages(base);
  if (packages.length === 0)
    failures.push("No publishable packages found under packages/");

  const destination = await mkdtemp(join(tmpdir(), "meterkit-pack-"));
  try {
    for (const { name, directory, entryPoint } of packages) {
      let packed;
      try {
        packed = packedFiles(directory, destination);
      } catch (cause) {
        failures.push(
          `${name}: could not be packed — ${cause instanceof Error ? cause.message.split("\n")[0] : cause}`,
        );
        continue;
      }
      if (!packed.has(entryPoint)) {
        failures.push(`${name}: entry point ${entryPoint} is not packed`);
        continue;
      }

      // Walk the emitted module graph from the entry point.
      const pending = [entryPoint];
      const seen = new Set();
      while (pending.length) {
        const current = pending.pop();
        if (seen.has(current)) continue;
        seen.add(current);
        let source;
        try {
          source = await readFile(join(directory, current), "utf8");
        } catch {
          continue;
        }
        for (const specifier of relativeImports(source)) {
          const target = posix.normalize(
            posix.join(posix.dirname(current), specifier),
          );
          if (!packed.has(target)) {
            failures.push(
              `${name}: ${current} imports ${specifier}, but ${target} is not packed`,
            );
            continue;
          }
          pending.push(target);
        }
      }
    }
  } finally {
    await rm(destination, { recursive: true, force: true });
  }

  return { passed: failures.length === 0, failures, checked: packages.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyPackageContents();
  if (!result.passed) {
    for (const failure of result.failures)
      process.stderr.write(`- ${failure}\n`);
    process.exitCode = 1;
  }
  process.stdout.write(
    `${JSON.stringify({
      passed: result.passed,
      checked: result.checked,
      failures: result.failures.length,
    })}\n`,
  );
}
