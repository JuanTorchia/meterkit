import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

const meterKitFrontmatter = frontmatterSchema.extend({
  section: z.string(),
  order: z.number().int().nonnegative(),
  lastReviewedAt: z.string(),
  productVersionRange: z.string(),
  surface: z.enum([
    "general",
    "express",
    "next-route",
    "hono",
    "mcp",
    "agent-budget",
  ]),
  maturity: z.enum(["recommended", "supported", "experimental", "deprecated"]),
  claimKeys: z.array(z.string()),
});

export const docs = defineDocs({
  dir: "../../content/docs",
  docs: { schema: meterKitFrontmatter },
});

export default defineConfig();
