# Self-service beta support matrix

The machine-readable support contract is [`support-matrix.json`](../support-matrix.json).
It is the source of truth for public compatibility claims.

- Runtime: Node.js 22 LTS.
- Supported HTTP surfaces: Express, Next Route and Hono.
- Experimental surface: MCP over stdio. Its native unpaid-requirements probe is
  not represented as an HTTP 402 or counted as equivalent activation evidence.
- Supported package managers: npm and pnpm.
- Operating systems: Linux, macOS and Windows.
- Experimental, non-blocking package managers: Yarn and Bun.

A supported cell still requires exact public-registry verification for the
release being recommended. Source-tree and packed-artifact checks do not prove
that a registry release works, and none of these checks count as external users.
