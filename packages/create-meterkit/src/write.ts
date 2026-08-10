import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rmdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { initializerPlanSchema, type InitializerPlan } from "@usemeterkit/core";
import { templateRootFor } from "./plan.js";

async function assertSafeTarget(target: string): Promise<void> {
  try {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error("unsafe target type");
    if ((await readdir(target)).length > 0)
      throw new Error("target is not empty");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function writeInitializerPlan(
  input: InitializerPlan,
): Promise<void> {
  const plan = initializerPlanSchema.parse(input);
  const target = plan.targetDirectory;
  const parent = dirname(target);
  await mkdir(parent, { recursive: true });
  const lockPath = join(parent, `.${basename(target)}.meterkit.lock`);
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  let staging: string | undefined;
  try {
    lock = await open(
      lockPath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await assertSafeTarget(target);
    staging = join(parent, `.${basename(target)}.meterkit-${randomUUID()}`);
    await mkdir(staging, { mode: 0o700 });
    const templateRoot = templateRootFor(plan.surface);
    for (const file of plan.files) {
      const source = join(templateRoot, file.path);
      const content = await readFile(source);
      const fingerprint = `sha256:${createHash("sha256").update(content).digest("hex")}`;
      if (fingerprint !== file.fingerprint)
        throw new Error("template fingerprint mismatch");
      const destination = join(staging, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, content, { flag: "wx", mode: 0o600 });
    }
    try {
      await access(target);
      await rmdir(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await rename(staging, target);
    staging = undefined;
  } catch (error) {
    throw new Error(
      `UNSAFE_FILESYSTEM: ${error instanceof Error ? error.message : "write failed"}`,
    );
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true });
    await lock?.close();
    await rm(lockPath, { force: true });
  }
}
