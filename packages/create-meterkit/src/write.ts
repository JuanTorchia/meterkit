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
import { spawn } from "node:child_process";
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

function packageManagerCommands(
  packageManager: InitializerPlan["packageManager"],
) {
  if (packageManager === "npm") {
    return {
      install: "npm install",
      dev: "npm run dev",
      check: "npm run check:unpaid",
      verify: "npm run verify",
      doctor: "npm run doctor",
      pay: "npm run pay:test",
    };
  }
  if (packageManager === "yarn") {
    return {
      install: "yarn install",
      dev: "yarn dev",
      check: "yarn check:unpaid",
      verify: "yarn verify",
      doctor: "yarn doctor",
      pay: "yarn pay:test",
    };
  }
  if (packageManager === "bun") {
    return {
      install: "bun install",
      dev: "bun run dev",
      check: "bun run check:unpaid",
      verify: "bun run verify",
      doctor: "bun run doctor",
      pay: "bun run pay:test",
    };
  }
  return {
    install: "pnpm install",
    dev: "pnpm dev",
    check: "pnpm check:unpaid",
    verify: "pnpm verify",
    doctor: "pnpm doctor",
    pay: "pnpm pay:test",
  };
}

function renderTemplate(content: Buffer, plan: InitializerPlan) {
  const commands = packageManagerCommands(plan.packageManager);
  return content
    .toString("utf8")
    .replaceAll("{{INSTALL_COMMAND}}", commands.install)
    .replaceAll("{{DEV_COMMAND}}", commands.dev)
    .replaceAll("{{CHECK_COMMAND}}", commands.check)
    .replaceAll("{{VERIFY_COMMAND}}", commands.verify)
    .replaceAll("{{DOCTOR_COMMAND}}", commands.doctor)
    .replaceAll("{{PAY_COMMAND}}", commands.pay)
    .replaceAll(
      "{{RECIPIENT}}",
      plan.recipient ?? "replace_with_a_disposable_devnet_address",
    )
    .replaceAll("DURABILITY_MODE=memory", `DURABILITY_MODE=${plan.durability}`);
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
      await writeFile(destination, renderTemplate(content, plan), {
        flag: "wx",
        mode: 0o600,
      });
    }
    if (plan.recipient) {
      const examplePath = join(staging, ".env.example");
      const environment = (await readFile(examplePath, "utf8")).replace(
        "replace_with_a_disposable_devnet_address",
        plan.recipient,
      );
      const environmentName =
        plan.surface === "next-route" ? ".env.local" : ".env";
      await writeFile(join(staging, environmentName), environment, {
        flag: "wx",
        mode: 0o600,
      });
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

type InstallPackageManager = "npm" | "pnpm" | "yarn" | "bun";
type InstallExecution = { exitCode: number; stderr: string };
type InstallRunner = (
  command: string[],
  cwd: string,
) => Promise<InstallExecution>;

function defaultInstallRunner(
  command: string[],
  cwd: string,
): Promise<InstallExecution> {
  return new Promise((resolvePromise) => {
    const child = spawn(command[0]!, command.slice(1), {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
      shell: false,
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      if (stderr.length < 4_096) stderr += chunk;
    });
    child.on("error", (error) =>
      resolvePromise({ exitCode: 1, stderr: error.message }),
    );
    child.on("close", (code) =>
      resolvePromise({ exitCode: code ?? 1, stderr: stderr.trim() }),
    );
  });
}

export async function installGeneratedProject(
  directory: string,
  packageManager: InstallPackageManager,
  runner: InstallRunner = defaultInstallRunner,
): Promise<
  | { state: "ready" }
  | {
      state: "written_install_failed";
      recoveryCommand: string;
      detail: string;
    }
> {
  const command = [packageManager, "install"];
  const result = await runner(command, directory);
  if (result.exitCode === 0) return { state: "ready" };
  return {
    state: "written_install_failed",
    recoveryCommand: command.join(" "),
    detail: result.stderr.slice(0, 1_000) || "dependency installation failed",
  };
}
