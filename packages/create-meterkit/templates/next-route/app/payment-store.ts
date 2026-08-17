import { StandalonePostgresPaymentStore } from "@usemeterkit/database";
import { MemoryPaymentStore, type PaymentStore } from "@usemeterkit/sdk";

async function initialize(): Promise<PaymentStore> {
  const mode = process.env.DURABILITY_MODE ?? "memory";
  if (mode === "memory") {
    process.stderr.write(
      "WARNING: memory payment store is non-durable; do not serve paid production traffic.\n",
    );
    return new MemoryPaymentStore();
  }
  if (mode !== "postgres")
    throw new Error("DURABILITY_MODE must be memory or postgres");
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is required when DURABILITY_MODE=postgres");
  const store = StandalonePostgresPaymentStore.connect(url);
  await store.migrate();
  return store;
}

export const paymentStore = initialize();
