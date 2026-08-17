import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("English and Spanish public CTA preserve beta and commercial boundaries", async () => {
  const [page, readme, english, spanish] = await Promise.all([
    readFile("apps/web/app/pilots/page.tsx", "utf8"),
    readFile("README.md", "utf8"),
    readFile("docs/en/README.md", "utf8"),
    readFile("docs/es/README.md", "utf8"),
  ]);
  for (const source of [page, readme]) {
    assert.match(
      source,
      /five-person|Five independent|cinco personas|Cinco builders/i,
    );
    assert.match(
      source,
      /not (?:paid|tester compensation)|no se les paga|no tester compensation/i,
    );
    assert.match(source, /USD 100/);
  }
  assert.match(english, /free five-person/i);
  assert.match(spanish, /beta devnet gratuita para cinco/i);
  for (const source of [english, spanish]) {
    assert.match(source, /devnet/i);
    assert.match(source, /0|zero|cero/i);
  }
});
