import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type pg from "pg";

const MIGRATIONS = [
  "001_replay_store.sql",
  "002_authorization_reservations.sql",
] as const;
const LOCK_ID = 1_294_638_920;

export async function migrateStandalonePaymentStore(pool: pg.Pool) {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    for (const version of MIGRATIONS) {
      const sql = await readFile(
        fileURLToPath(
          new URL(`../migrations/standalone/${version}`, import.meta.url),
        ),
        "utf8",
      );
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO meterkit_standalone_migrations(version) VALUES($1) ON CONFLICT DO NOTHING",
          [version],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [LOCK_ID])
      .catch(() => {});
    client.release();
  }
}
