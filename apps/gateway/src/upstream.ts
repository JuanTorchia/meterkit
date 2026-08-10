import { isIP } from "node:net";

const MAX_UPSTREAM_BYTES = 1_000_000;

export function parseUpstreamAllowlist(value: string) {
  const hosts = value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (!hosts.length) throw new Error("UPSTREAM_HOST_ALLOWLIST_EMPTY");
  return new Set(hosts);
}

export function assertAllowedUpstream(
  rawUrl: string,
  allowedHosts: ReadonlySet<string>,
) {
  const url = new URL(rawUrl);
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    url.port ||
    isIP(hostname) !== 0 ||
    !allowedHosts.has(hostname)
  ) {
    throw new Error("UPSTREAM_NOT_ALLOWED");
  }
  return url;
}

export async function fetchAllowedUpstream(input: {
  upstreamUrl: string;
  clientQuery: URLSearchParams;
  allowedHosts: ReadonlySet<string>;
  request?: typeof fetch;
  timeoutMs?: number;
}) {
  const url = assertAllowedUpstream(input.upstreamUrl, input.allowedHosts);
  for (const [key, value] of input.clientQuery)
    url.searchParams.append(key, value);
  const response = await (input.request ?? fetch)(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(input.timeoutMs ?? 10_000),
    headers: { accept: "application/json" },
  });
  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim();
  if (contentType !== "application/json")
    throw new Error("UPSTREAM_CONTENT_TYPE_REJECTED");
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_UPSTREAM_BYTES)
    throw new Error("UPSTREAM_RESPONSE_TOO_LARGE");
  const body = await readBounded(response, MAX_UPSTREAM_BYTES);
  return {
    status: response.status,
    body,
    contentType,
    sourceUrl: url.toString(),
  };
}

async function readBounded(response: Response, limit: number) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new Error("UPSTREAM_RESPONSE_TOO_LARGE");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
