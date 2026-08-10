import { describe, expect, it } from "vitest";
import { SOLANA_DEVNET } from "@usemeterkit/sdk";
import { premiumProduct } from "./product";

describe("Next.js premium route contract", () => {
  it("uses the same canonical devnet product contract as Express", async () => {
    const product = premiumProduct("7YttLkHDoNj9wyDur5zto7qLQyHQVwMkwXU88HZ6sW9");
    expect(product).toMatchObject({
      priceAtomic: "10000",
      network: SOLANA_DEVNET,
      resource: "http://localhost:3000/api/premium",
    });
  });
});
