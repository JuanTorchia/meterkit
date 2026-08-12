import { describe, expect, it } from "vitest";
import { buildIdentity } from "./build-identity.js";

describe("build identity", () => {
  it("always reports when the process started", () => {
    // The signal that costs no platform configuration, and the one that would
    // have shown a container serving code older than the change being sought.
    const identity = buildIdentity();
    expect(Date.parse(identity.startedAt)).not.toBeNaN();
    expect(identity.startedAt).toBe(buildIdentity().startedAt);
  });

  it("reports the published version of the bundle it ships with", () => {
    // Guards the exports map: without "./package.json" this read throws and the
    // field silently disappears, which is worse than never having offered it.
    expect(buildIdentity().version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("omits the commit rather than guessing when none was supplied", () => {
    const original = process.env.SOURCE_COMMIT;
    try {
      delete process.env.SOURCE_COMMIT;
      expect(buildIdentity().commit).toBeUndefined();
      process.env.SOURCE_COMMIT = "not-a-sha";
      expect(buildIdentity().commit).toBeUndefined();
      process.env.SOURCE_COMMIT = "d8d21d3aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      expect(buildIdentity().commit).toBe("d8d21d3");
    } finally {
      if (original === undefined) delete process.env.SOURCE_COMMIT;
      else process.env.SOURCE_COMMIT = original;
    }
  });
});
