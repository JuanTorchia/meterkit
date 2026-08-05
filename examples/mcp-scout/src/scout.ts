import { z } from "zod";

export type ProjectFacts = {
  name: string; fullName: string; description: string | null; htmlUrl: string;
  homepage: string | null; license: string | null; defaultBranch: string;
  createdAt: string; updatedAt: string; pushedAt: string; archived: boolean;
  openIssues: number; stars: number; forks: number; latestRelease: string | null;
  checkedAt: string; apiSource: string; releaseSource: string;
};

export async function fetchProject(
  repository: string,
  request: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<ProjectFacts> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("Formato de repositorio inválido");
  }
  const apiSource = `https://api.github.com/repos/${repository}`;
  const releaseSource = `${apiSource}/releases/latest`;
  const [repoResponse, releaseResponse] = await Promise.all([
    safeGithubFetch(apiSource, false, request),
    safeGithubFetch(releaseSource, true, request),
  ]);
  if (!repoResponse.ok) throw new Error(`GitHub respondió ${repoResponse.status} para ${repository}`);
  const repo = repoSchema.parse(await readBoundedJson(repoResponse));
  const release = releaseResponse.ok ? releaseSchema.parse(await readBoundedJson(releaseResponse)) : null;
  return {
    name: repo.name, fullName: repo.full_name, description: repo.description,
    htmlUrl: repo.html_url, homepage: repo.homepage || null,
    license: repo.license?.spdx_id ?? null, defaultBranch: repo.default_branch,
    createdAt: repo.created_at, updatedAt: repo.updated_at, pushedAt: repo.pushed_at,
    archived: repo.archived, openIssues: repo.open_issues_count,
    stars: repo.stargazers_count, forks: repo.forks_count,
    latestRelease: release?.tag_name ?? null,
    checkedAt: now().toISOString(), apiSource, releaseSource,
  };
}

async function safeGithubFetch(url: string, allowNotFound: boolean, request: typeof fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "user-agent": "meterkit-scout/0.1",
      "x-github-api-version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await request(url, {
      signal: controller.signal,
      headers,
    });
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 512_000) throw new Error("GitHub response exceeds the 500 KiB safety limit");
    if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub API rate limit reached; configure GITHUB_TOKEN or retry later");
    }
    if (!allowNotFound && response.status === 404) throw new Error("Repositorio público no encontrado");
    return response;
  } finally { clearTimeout(timer); }
}

async function readBoundedJson(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 512_000) {
    throw new Error("GitHub response exceeds the 500 KiB safety limit");
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export function renderReport(project: ProjectFacts) {
  return [
    `# Solana Project Scout: ${project.fullName}`,
    "",
    "## Identidad pública",
    project.description || "Sin descripción pública.",
    `Repositorio: ${project.htmlUrl}`,
    `Sitio declarado: ${project.homepage ?? "No declarado"}`,
    `Licencia detectada: ${project.license ?? "No detectada"}`,
    "",
    "## Actividad observable",
    `Creado: ${project.createdAt}`,
    `Último push: ${project.pushedAt}`,
    `Metadata actualizada: ${project.updatedAt}`,
    `Rama por defecto: ${project.defaultBranch}`,
    `Última release: ${project.latestRelease ?? "No publicada"}`,
    `Archivado: ${project.archived ? "sí" : "no"}`,
    `Issues abiertos reportados por GitHub: ${project.openIssues}`,
    `Stars/forks (señales sociales, no calidad ni valor): ${project.stars}/${project.forks}`,
    "",
    "## Fuentes",
    `- ${project.apiSource}`,
    `- ${project.releaseSource}`,
    `- ${project.htmlUrl}`,
    `Fecha de consulta: ${project.checkedAt}`,
    "",
    "Reporte factual automatizado. No verifica identidad del equipo, seguridad del código ni estado onchain.",
    "No constituye asesoramiento de inversión ni señal de compra.",
  ].join("\n");
}

const repoSchema = z.object({
  name: z.string(), full_name: z.string(), description: z.string().nullable(),
  html_url: z.string().url(), homepage: z.string().nullable(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  default_branch: z.string(), created_at: z.string(), updated_at: z.string(),
  pushed_at: z.string(), archived: z.boolean(), open_issues_count: z.number(),
  stargazers_count: z.number(), forks_count: z.number(),
});
const releaseSchema = z.object({ tag_name: z.string() });
