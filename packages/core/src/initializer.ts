import { isAbsolute, posix } from "node:path";
import { z } from "zod";

export const initializerSurfaceSchema = z.enum([
  "express",
  "next-route",
  "hono",
  "mcp",
]);
export const initializerPackageManagerSchema = z.enum([
  "pnpm",
  "npm",
  "yarn",
  "bun",
]);

const relativeTemplatePathSchema = z
  .string()
  .min(1)
  .max(512)
  .superRefine((value, context) => {
    const normalized = posix.normalize(value.replaceAll("\\", "/"));
    const firstSegment = normalized.split("/")[0] ?? "";
    const isWindowsDevice =
      /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(firstSegment);
    const hasControlCharacter = [...value].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || codePoint === 127;
    });
    if (
      isAbsolute(value) ||
      /^[A-Za-z]:[\\/]/.test(value) ||
      isWindowsDevice ||
      normalized === ".." ||
      normalized.startsWith("../") ||
      normalized.startsWith("/") ||
      normalized !== value ||
      hasControlCharacter
    ) {
      context.addIssue({
        code: "custom",
        message: "template path must be normalized and relative",
      });
    }
  });

const environmentKeySchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]{0,63}$/)
  .refine(
    (value) => !/(PRIVATE|SECRET|SEED|TOKEN|SIGNATURE|PASSWORD)/.test(value),
    {
      message:
        "initializer plans must not request secret-like environment keys",
    },
  );

export const initializerPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    initializerVersion: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
    surface: initializerSurfaceSchema,
    targetDirectory: z.string().min(1).max(4_096),
    packageManager: initializerPackageManagerSchema,
    network: z.literal("solana-devnet"),
    files: z
      .array(
        z
          .object({
            path: relativeTemplatePathSchema,
            fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
          })
          .strict(),
      )
      .min(1)
      .max(256),
    dependencies: z.record(z.string().min(1), z.string().min(1)),
    environmentKeys: z.array(environmentKeySchema).max(32),
    warnings: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/)).max(32),
  })
  .strict()
  .refine(
    (plan) =>
      new Set(plan.files.map((file) => file.path)).size === plan.files.length,
    {
      message: "initializer file paths must be unique",
      path: ["files"],
    },
  );
export type InitializerPlan = z.infer<typeof initializerPlanSchema>;
