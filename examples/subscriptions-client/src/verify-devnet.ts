import { readFile } from "node:fs/promises";
import {
  address,
  appendTransactionMessageInstruction,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
} from "@solana/kit";
import {
  fetchFixedDelegation,
  fetchSubscriptionAuthority,
  findFixedDelegationPda,
  findSubscriptionAuthorityPda,
} from "@solana/subscriptions";
import {
  buildFixedAllowance,
  buildInitSubscriptionAuthority,
  buildRevokeAllForMint,
  buildRevokeDelegation,
} from "@usemeterkit/subscriptions";

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const wsUrl = process.env.SOLANA_WS_URL ?? "wss://api.devnet.solana.com";
const mint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const tokenProgram = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const delegate = address(required("DELEGATE_WALLET"));
const signer = await createKeyPairSignerFromBytes(await readKeypair());
const rpc = createSolanaRpc(rpcUrl);
const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);
const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const userAta = await findUserAta();
const [subscriptionAuthority] = await findSubscriptionAuthorityPda({
  user: signer.address,
  tokenMint: mint,
});
const nonce = BigInt(Date.now());
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
const maxAtomic = 1_000_000n;

const initSignature = await send(
  await buildInitSubscriptionAuthority({
    owner: signer,
    mint,
    tokenProgram,
    userAta,
  }),
);
const authority = await fetchSubscriptionAuthority(rpc, subscriptionAuthority);
const authorityInitId = authority.data.initId;
const [delegationAccount] = await findFixedDelegationPda({
  subscriptionAuthority,
  delegator: signer.address,
  delegatee: delegate,
  nonce,
});

const createSignature = await send(
  await buildFixedAllowance({
    owner: signer,
    mint,
    delegate,
    maxAtomic,
    expiresAt,
    nonce,
    authorityInitId,
  }),
);
const created = await fetchFixedDelegation(rpc, delegationAccount);

const revokeSignature = await send(
  buildRevokeDelegation({
    owner: signer,
    delegationAccount,
  }),
);
const delegationAfterRevoke = await rpc
  .getAccountInfo(delegationAccount, {
    commitment: "confirmed",
    encoding: "base64",
  })
  .send();
if (delegationAfterRevoke.value !== null) {
  throw new Error("DELEGATION_STILL_EXISTS_AFTER_REVOKE");
}

const closeAuthoritySignature = await send(
  await buildRevokeAllForMint({
    owner: signer,
    mint,
    tokenProgram,
  }),
);

process.stdout.write(
  `${JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      network: "solana-devnet",
      owner: signer.address,
      delegate,
      mint,
      userAta,
      subscriptionAuthority,
      delegationAccount,
      policy: {
        maxAtomic: String(maxAtomic),
        expiresAt: expiresAt.toISOString(),
        nonce: String(nonce),
        authorityInitId: String(authorityInitId),
      },
      createdAccount: {
        delegatee: created.data.header.delegatee,
        amount: String(created.data.amount),
        expiryTs: String(created.data.expiryTs),
      },
      transactions: {
        initAuthority: explorer(initSignature),
        createAllowance: explorer(createSignature),
        revokeAllowance: explorer(revokeSignature),
        closeAuthority: explorer(closeAuthoritySignature),
      },
      revoked: delegationAfterRevoke.value === null,
    },
    null,
    2,
  )}\n`,
);

async function send(instruction: Instruction) {
  const { value: lifetime } = await rpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();
  const message = appendTransactionMessageInstruction(
    instruction,
    setTransactionMessageLifetimeUsingBlockhash(
      lifetime,
      setTransactionMessageFeePayerSigner(
        signer,
        createTransactionMessage({ version: 0 }),
      ),
    ),
  );
  const transaction = await signTransactionMessageWithSigners(message);
  assertIsTransactionWithBlockhashLifetime(transaction);
  await sendAndConfirm(transaction, { commitment: "confirmed" });
  return getSignatureFromTransaction(transaction);
}

async function findUserAta() {
  const result = await rpc
    .getTokenAccountsByOwner(
      signer.address,
      { mint },
      { commitment: "confirmed", encoding: "jsonParsed" },
    )
    .send();
  const account = result.value.find((candidate) => {
    const data = candidate.account.data;
    return typeof data === "object" && "parsed" in data;
  });
  if (!account) throw new Error("USDC_ATA_NOT_FOUND");
  return account.pubkey;
}

async function readKeypair() {
  const path = required("SOLANA_KEYPAIR_PATH");
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64 ||
    !parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)
  ) {
    throw new Error("SOLANA_KEYPAIR_PATH must contain a 64-byte keypair");
  }
  return Uint8Array.from(parsed as number[]);
}

function explorer(signature: string) {
  return {
    signature,
    url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
