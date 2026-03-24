# Milady ICP Toolkit (`@elizaos-plugins/plugin-icp`)

**Milady ICP Toolkit** (repo: **`milady-icp-toolkit`**) is an [ElizaOS](https://github.com/elizaos/eliza) plugin for the [Internet Computer](https://internetcomputer.org/). It exposes wallet/canister tooling, Launchpad-style registry queries, ICRC-1-oriented flows, and T3kNo-Logic ecosystem helpers (products, social drafts).

Maintained by **[T3kNo-Logic](https://github.com/T3knoLogic)** for use with **Milady** and other ElizaOS agents.

## Repository

- **GitHub:** [github.com/T3knoLogic/milady-icp-toolkit](https://github.com/T3knoLogic/milady-icp-toolkit)  
- **npm package name (install key):** `@elizaos-plugins/plugin-icp`

## Features

- **CREATE_TOKEN** — Create tokens via configured flows (e.g. PickPump-style creation where implemented).
- **QUERY_ICP_LAUNCHPAD** — Launchpad wallet cycles and registered canisters (anonymous query actors).
- **QUERY_T3KNO_PRODUCTS** — T3kNo-Logic product reference (NFT Matrix, Machina, Bazaar, Bonsai Widget, etc.).
- **DRAFT_T3KNO_SOCIAL** — Draft short social copy for ecosystem products (optional AI path where configured).
- **ICP wallet provider** — Identity and canister interaction helpers (`@dfinity/*`).

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
