import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from "@elizaos/core";
import { fetchIcrc1Portfolio } from "../utils/ic/fetchPortfolio";
import { icpWalletProvider } from "../providers/wallet";

const ICP_HOST = process.env.ICP_HOST || "https://icp0.io";

/** Principal-like substring in user text (IC textual ID). */
function extractPrincipal(text: string): string | null {
  const m = text.match(
    /\b([2-9a-z]{5,}-[2-9a-z-]+(?:-[2-9a-z-]+){2,})\b/i,
  );
  return m?.[1]?.trim() ?? null;
}

export const executeQueryIcrcPortfolio: Action = {
  name: "QUERY_ICRC_PORTFOLIO",
  similes: [
    "ICP_PORTFOLIO",
    "ICRC_BALANCES",
    "MY_ICP_TOKENS",
    "LIST_IC_TOKENS",
    "CKBTC_BALANCE",
    "CHECK_ICP_HOLDINGS",
  ],
  description:
    "Fetch ICRC-1 balances for a principal across known mainnet ledgers (ICP, ckBTC, ckETH, ckUSDC, WICP, KONG). Use when the user asks for ICP token holdings, portfolio on Internet Computer, or ck-token balances. Requires a textual Principal ID unless the agent wallet key is configured (then uses that principal).",
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const raw = message?.content?.text || "";
    if (extractPrincipal(raw)) return true;
    const text = raw.toLowerCase();
    const ecosystem = [
      "icrc",
      "internet computer",
      "ckbtc",
      "cketh",
      "ckusdc",
      "wicp",
      "kong",
    ];
    if (!ecosystem.some((k) => text.includes(k)) && !text.includes("icp")) {
      return false;
    }
    return [
      "balance",
      "portfolio",
      "holding",
      "ledger",
      "token",
      "tokens",
      "how much",
      "assets",
    ].some((k) => text.includes(k));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    options: { callback?: HandlerCallback },
  ): Promise<boolean> => {
    const callback = options?.callback;
    const text = message?.content?.text || "";

    let principal = extractPrincipal(text);
    if (!principal) {
      const prov = await icpWalletProvider.get(runtime, message, _state);
      if (prov.principal) principal = prov.principal;
    }

    if (!principal) {
      if (callback) {
        await callback({
          text: "Provide a textual **Principal** (e.g. `aaaaa-aa`) or configure `INTERNET_COMPUTER_PRIVATE_KEY` so I can use the agent’s principal.",
          action: executeQueryIcrcPortfolio,
        });
      }
      return true;
    }

    try {
      const rows = await fetchIcrc1Portfolio(principal, undefined, ICP_HOST);
      const lines = rows.map(
        (r) =>
          `- **${r.symbol}** (${r.name}): \`${r.balanceFormatted}\` — ledger \`${r.ledgerId}\` (${r.category})`,
      );
      const reply = `**ICRC-1 portfolio** for \`${principal}\`:\n\n${lines.join("\n")}\n\n_Swaps: use official [ICPSwap](https://app.icpswap.com) or [KongSwap](https://kongswap.io); verify URLs before signing._`;
      if (callback) {
        await callback({ text: reply, action: executeQueryIcrcPortfolio });
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Could not load IC portfolio: ${msg}`,
          action: executeQueryIcrcPortfolio,
        });
      }
      return true;
    }
  },
};
