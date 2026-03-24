# Milady ICP Toolkit (`@elizaos-plugins/plugin-icp`)

**Milady ICP Toolkit** (repo: **`milady-icp-toolkit`**) is an [ElizaOS](https://github.com/elizaos/eliza) plugin for the [Internet Computer](https://internetcomputer.org/). It exposes wallet/canister tooling, Launchpad-style registry queries, ICRC-1-oriented flows, and T3kNo-Logic ecosystem helpers (products, social drafts).

Maintained by **[T3kNo-Logic](https://github.com/T3knoLogic)** for use with **Milady** and other ElizaOS agents.

## Repository

- **GitHub:** [github.com/T3knoLogic/milady-icp-toolkit](https://github.com/T3knoLogic/milady-icp-toolkit)  
- **npm package name (install key):** `@elizaos-plugins/plugin-icp`

## Features (at a glance)

| Surface | What it does |
|--------|----------------|
| **CREATE_TOKEN** | End-to-end PickPump meme token creation (LLM extraction, logo image, upload, signed canister call). |
| **QUERY_ICP_LAUNCHPAD** | Read Launchpad wallet cycles or list registry canisters via **anonymous** query actors. |
| **QUERY_T3KNO_PRODUCTS** | Inject vetted T3kNo-Logic product facts + Gumroad/Bazaar links (from file or built-in fallback). |
| **DRAFT_T3KNO_SOCIAL** | Short Twitter/Discord drafts with product guardrails; LLM with template fallback. |
| **icpWalletProvider** | Authenticated `HttpAgent` + `Ed25519KeyIdentity` from `INTERNET_COMPUTER_PRIVATE_KEY` (hex, 32-byte seed). |
| **createAnonymousActor** | Public query/update patterns without a user key (used by Launchpad queries). |

---

## Feature reference (in depth)

### Plugin export (`icpPlugin`)

Registered name: **`icp`**. Exposes **one provider**, **four actions**, **no evaluators**. Compatible with ElizaOS/Milady plugin loading (`@elizaos-plugins/plugin-icp`).

---

### Provider: `icpWalletProvider`

| Aspect | Detail |
|--------|--------|
| **Setting** | `INTERNET_COMPUTER_PRIVATE_KEY` (via `runtime.getSetting`) — **required** for authenticated flows. |
| **Key format** | Hex string decoded to **32 bytes**; passed to `Ed25519KeyIdentity.fromSecretKey`. Wrong length → error. |
| **Default host** | `WalletProvider` defaults to `https://ic0.app` for signed operations. |
| **Return shape** | `wallet`, `identity`, `principal` (text), `isAuthenticated`, `createActor` bound to wallet, or `error` if misconfigured. |
| **Use case** | Any action that must call canisters **as the agent’s ICP identity** (e.g. PickPump `create_token`). |

Exported helper **`createAnonymousActor(idlFactory, canisterId, host?, fetchRootKey?)`**: builds an `HttpAgent` with **no identity**, `verifyQuerySignatures: false`, optional `fetchRootKey` for local replica. Used so **read-only Launchpad data** does not require the user’s private key on every query.

---

### Action: `CREATE_TOKEN` (PickPump)

| Aspect | Detail |
|--------|--------|
| **Canister** | `tl65e-yyaaa-aaaah-aq2pa-cai` (`CANISTER_IDS.PICK_PUMP`). |
| **Trigger keywords** | pickpump, pp, token, coin, mint, launch, deploy, plus Chinese variants (皮克帮, 代币, …). |
| **Similes** | `CREATE_PICKPUMP_TOKEN`, `MINT_PICKPUMP`, `PICKPUMP_TOKEN`, `PP_TOKEN`, etc. |
| **Pipeline** | (1) `composeState` + `ModelType.OBJECT_LARGE` with schema → name/symbol/description. (2) `ModelType.TEXT_LARGE` for logo prompt. (3) `ModelType.IMAGE` → logo URL (512×512). (4) **`uploadFileToWeb3Storage`** → gateway URL. (5) **`icpWalletProvider`** → `createActor` + Candid `create_token`. |
| **Dependencies** | Configured **large object model**, **image model**, **Web3.Storage (or configured uploader)** credentials in the host app, and **valid ICP identity** with cycles/rights for PickPump. |
| **Failure modes** | Missing image provider → no logo → throws. Upload failure → throws. Wallet missing → user-facing error callback. |

---

### Action: `QUERY_ICP_LAUNCHPAD`

| Aspect | Detail |
|--------|--------|
| **Canisters** | Wallet: `tw5ow-tiaaa-aaaau-afpha-cai`; Registry: `t76fk-faaaa-aaaau-afpgq-cai` (`LAUNCHPAD_CANISTERS`). |
| **Host** | `process.env.ICP_HOST` or **`https://mainnet.dfinity.network`** (note: differs from wallet provider’s `ic0.app` default). |
| **Access** | **Anonymous** actors only; no `INTERNET_COMPUTER_PRIVATE_KEY` required for these reads. |
| **Routing** | If message suggests **balance/cycles/wallet** but not registry → `get_balance()` on wallet canister (formatted in **T cycles**). If **registry/canister/list** or ambiguous → `list_all()` on registry (name, id, network per row). |
| **Similes** | `LAUNCHPAD_BALANCE`, `LIST_LAUNCHPAD_CANISTERS`, `QUERY_ICP_REGISTRY`, `CHECK_CYCLES`, … |
| **Validate keywords** | launchpad, cycles, balance, canister, registry, icp, mainnet, wallet, … |

---

### Action: `QUERY_T3KNO_PRODUCTS`

| Aspect | Detail |
|--------|--------|
| **Data source** | `loadT3knoKnowledge()` tries, in order: `cwd/knowledge/`, parent `../knowledge/`, repo-root `T3KNO_LOGIC_PRODUCTS_AND_LINKS.md`, paths relative to plugin root — then **`FALLBACK_KNOWLEDGE`** markdown if no file exists. |
| **Purpose** | Keeps NFT Matrix, Machina, Bonsai Widget, Bazaar, Gumroad links **consistent** with T3kNo-Logic positioning (NFT Matrix ≠ streaming widget). |
| **Validate keywords** | nft matrix, machina, bazaar, bonsai widget, t3kno, gumroad, enchanted bonsai, … |
| **Output** | Full knowledge blob plus **one-line pitches** for each major product. |

---

### Action: `DRAFT_T3KNO_SOCIAL`

| Aspect | Detail |
|--------|--------|
| **Channel** | **Twitter** (280 chars) unless message contains “discord” → **500** chars. |
| **Product detection** | nft matrix → NFT Matrix; machina → Machina; bonsai widget → Bonsai Widget; bazaar / t3kno-logic → Bazaar; else default **NFT Matrix**. |
| **Model** | `ModelType.TEXT_SMALL` over a composed prompt that embeds `loadT3knoKnowledge()` and explicit “do not confuse Matrix vs Widget” rules. |
| **Post-processing** | Hard trim to max length; **`validateProductMentions`** appends warning suffix if copy conflates streaming vs NFT generator. |
| **Fallback** | On LLM error, returns static **fallback** lines per product (Gumroad/Bazaar URLs); message may mention adding API keys for AI drafts. |

---

### Constants (`src/constants/canisters.ts`)

| Symbol | Principal | Role |
|--------|-----------|------|
| `PICK_PUMP` | `tl65e-yyaaa-aaaah-aq2pa-cai` | Meme token creation |
| `WALLET` | `tw5ow-tiaaa-aaaau-afpha-cai` | Launchpad cycles wallet |
| `REGISTRY` | `t76fk-faaaa-aaaau-afpgq-cai` | Registered canister list |
| `INTEGRATIONS` | `ty7d6-iyaaa-aaaau-afpga-cai` | (reserved / ecosystem) |
| `FRONTEND` | `tnyst-jqaaa-aaaau-afpfq-cai` | Launchpad UI canister reference |

## Install

### From GitHub (recommended until published to npm)

```bash
pnpm add github:T3knoLogic/milady-icp-toolkit
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "@elizaos-plugins/plugin-icp": "github:T3knoLogic/milady-icp-toolkit"
  }
}
```

Then run `pnpm install` and ensure your bundler resolves the package name `@elizaos-plugins/plugin-icp`.

### Monorepo / local path

```json
"@elizaos-plugins/plugin-icp": "file:../plugin-icp"
```

## Configuration

Set the agent’s Internet Computer identity via environment (see `agentConfig` in `package.json`):

```env
INTERNET_COMPUTER_PRIVATE_KEY=<your-ed25519-private-key-hex-or-format-expected-by-plugin>
```

Optional:

```env
ICP_HOST=https://mainnet.dfinity.network
```

Never commit keys. Use your host’s secret mechanism (env, vault, pairing).

## Usage

```typescript
import { icpPlugin } from "@elizaos-plugins/plugin-icp";

// Register with your ElizaOS runtime
runtime.registerPlugin(icpPlugin);
```

### Actions (examples)

- *“What’s the Launchpad wallet cycles balance?”* → `QUERY_ICP_LAUNCHPAD`
- *“List registered canisters in the Launchpad registry”* → `QUERY_ICP_LAUNCHPAD`
- *“What T3kNo products should I mention?”* → `QUERY_T3KNO_PRODUCTS`
- *“Draft a post for the Bazaar”* → `DRAFT_T3KNO_SOCIAL`

## Related: Milady on ICP

When Milady runs against the **milady_api** canister, many “ICP Toolkit” HTTP endpoints are also documented on-chain (e.g. `/api/ic/toolkit`). This repo is the **ElizaOS plugin** that runs inside the Node/Milady runtime; the canister complements it for hosted deployments.

## Build

```bash
pnpm install
pnpm run build
```

Output: `dist/` (ESM + types).

## Thank you

<p align="center">
  <img src="./docs/golden-bonsai-thanks.png" alt="Golden bonsai emblem" width="360" />
</p>

Thank you to the **Eliza Labs** team for building and stewarding the ElizaOS ecosystem that makes agents like Milady possible.

Special thanks to **Daniel McCoy** and **Shawmakesmagic** for paving the way for the dreamers and visionaries—your work opened doors for everyone building on this stack.

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Publish `milady-icp-toolkit` under `T3knoLogic` on GitHub

If your local clone still has `origin` pointing at another org (e.g. a fork source), add your public remote and push:

1. Create an **empty** repository on GitHub: `https://github.com/T3knoLogic/milady-icp-toolkit` (no README/license wizard, or delete defaults after).
2. In this directory:

```bash
git remote add t3kno https://github.com/T3knoLogic/milady-icp-toolkit.git
git push -u t3kno main
```

Optional: keep the old remote as `upstream` for syncing:

```bash
git remote rename origin upstream
git remote add origin https://github.com/T3knoLogic/milady-icp-toolkit.git
git push -u origin main
```

After the repo exists, enable **Issues** and a **Security policy** in GitHub repo settings if you want community contributions.

## Links

- Internet Computer docs: [internetcomputer.org/docs](https://internetcomputer.org/docs/)
- DFINITY agent-js: [@dfinity/agent](https://www.npmjs.com/package/@dfinity/agent)
- T3kNo-Logic ecosystem: [t3kno-logic.xyz](https://t3kno-logic.xyz) (Bazaar & merch)
