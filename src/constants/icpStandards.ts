/**
 * Reference text for agents — not legal advice; verify against official ICRC specs.
 */
export const ICP_TOKEN_STANDARDS_SUMMARY = `
## Internet Computer token & NFT standards (summary)

### ICRC-1 — Fungible tokens (ledger)
- **icrc1_balance_of**, **icrc1_transfer**, **icrc1_metadata**, **icrc1_supported_standards**
- Subaccounts: 32-byte optional subaccount per principal.
- Most “ICP ecosystem tokens” you trade are ICRC-1 ledgers.

### ICRC-2 — Approve / transfer_from
- **icrc2_allowance**, **icrc2_approve**, **icrc2_transfer_from**
- Used by DEX routers (e.g. swap paths that pull from your balance).
- **Security:** only approve spenders you trust; prefer limited amounts & time bounds when the ledger supports them.

### ICRC-3 — Transaction log & blocks (indexing)
- Block/transaction structure for indexers and explorers; often paired with ICRC-1 ledgers.

### Legacy NFT interfaces (still common)
- **DIP721** and **EXT** — collection-specific; balances are per canister, not one global “NFT ledger”.
- **Discovery:** use official collection canisters, marketplaces (e.g. Yumi, Entrepot history), or wallet UIs — there is no single chain-wide NFT enumeration API comparable to EVM indexers.

### ICRC-7 / ICRC-37 (NFT direction)
- Newer standards evolving for NFTs on ICP; adoption varies by collection.

### Practical guidance for agents
- **Read balances:** ICRC-1 **icrc1_balance_of** with (owner principal, subaccount) — anonymous query on public ledgers.
- **Swaps:** route users to audited frontends (**ICPSwap**, **KongSwap**); never ask for seed phrases; signing stays in Plug / II / OISY.
`.trim();
