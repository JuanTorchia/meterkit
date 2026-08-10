# Agentic Engineering Grant approval and tranche state

Status recorded on **2026-08-10**. This file is a dated addendum and does not
rewrite the application or closeout snapshots.

## Approval

The applicant reported receiving an email from Superteam on **2026-08-10**
confirming that MeterKit was approved for **200 USDG** under the Agentic
Engineering Grant.

This repository records the event as **approved, payment not yet confirmed**.
The email itself may contain account information and remains outside the public
repository.

## Official tranche terms verified on 2026-08-10

The official grant listing states:

- 50% is paid upfront after approval and KYC through the weekly payout cycle;
- 50% is paid after the working product is submitted for review;
- the second-tranche submission requires the live project URL, GitHub repository
  and eligible AI coding subscription receipts totaling USD 200.

Official listing:
<https://superteam.fun/earn/grants/agentic-engineering>

## Current state

| Item                              | State                                 | Evidence handling                                 |
| --------------------------------- | ------------------------------------- | ------------------------------------------------- |
| Application                       | Submitted 2026-08-04                  | Historical application snapshot                   |
| Grant decision                    | Approved, reported 2026-08-10         | Applicant email; not committed                    |
| KYC                               | Pending applicant confirmation        | Official Superteam flow only                      |
| Wallet compatibility              | Pending applicant confirmation        | Verify control and USDG support before processing |
| First tranche                     | Not yet confirmed received            | Record transaction privately after receipt        |
| Public product and repository     | Complete                              | Public URLs and GitHub                            |
| Technical closeout                | Complete                              | Files `07`–`10` and public evidence               |
| External integrations             | Zero confirmed                        | Must not be inferred from internal tests          |
| Eligible receipt totaling USD 200 | Pending applicant-controlled evidence | Keep outside public GitHub                        |
| Second-tranche request            | Pending                               | Submit only through the official listing          |

## Wallet check

USDG is available natively on Solana and uses Token-2022. A Solana-looking public
address alone is not sufficient evidence of operational compatibility. Before
payout processing, the applicant must confirm that:

1. the submitted address is a mainnet Solana wallet they control;
2. its wallet software supports receiving and sending Token-2022 assets;
3. the recovery material is safely controlled by the applicant;
4. the wallet has or can obtain enough SOL to pay a future outgoing token fee;
5. no devnet-only disposable wallet was accidentally submitted.

Do not post a seed phrase, private key, wallet export or unredacted receipt.

## Next-tranche package

After the first tranche arrives and the official form becomes available, submit:

- <https://meterkit.juanchi.dev>;
- <https://github.com/JuanTorchia/meterkit>;
- the final evidence package and requested project/Colosseum link if the form
  still asks for it;
- eligible AI coding subscription invoice(s) totaling exactly USD 200.

Report post-approval work separately from the already-complete technical
baseline. Internal dogfooding is useful but is not an external pilot, customer or
revenue.
