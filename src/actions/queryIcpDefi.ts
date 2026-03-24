import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from "@elizaos/core";
import { ICPSWAP, KONGSWAP } from "../constants/icpDefi";

export const executeQueryIcpDefi: Action = {
  name: "QUERY_ICP_DEFI_DEX",
  similes: [
    "ICPSWAP",
    "KONGSWAP",
    "ICP_SWAP",
    "ICP_DEX",
    "WHERE_TO_SWAP_ICP",
  ],
  description:
    "Point users to official ICPSwap and KongSwap web apps, docs, and reference ledger IDs (WICP, KONG). Emphasize URL verification and wallet-only signing. Use when the user asks where to swap tokens on ICP.",
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message?.content?.text || "").toLowerCase();
    return (
      text.includes("icpswap") ||
      text.includes("kongswap") ||
      text.includes("kong swap") ||
      (text.includes("swap") && text.includes("icp")) ||
      (text.includes("dex") && text.includes("ic"))
    );
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
    options: { callback?: HandlerCallback },
  ): Promise<boolean> => {
    const callback = options?.callback;
    const reply = `**DEX entry points (verify domain in your browser before signing)**

- **${ICPSWAP.name}** — ${ICPSWAP.appUrl} · docs: ${ICPSWAP.docsUrl} · WICP ledger reference: \`${ICPSWAP.wicpLedger}\`
- **${KONGSWAP.name}** — ${KONGSWAP.appUrl} · docs: ${KONGSWAP.docsUrl} · KONG ledger reference: \`${KONGSWAP.kongLedger}\` · main dex canister (verify on their UI): \`${KONGSWAP.mainDexCanister}\`

**Security:** Never share a seed phrase. Only approve token spenders you trust; prefer limited allowances. Phishing sites mimic DEX UIs — double-check the URL bar.`;
    if (callback) {
      await callback({ text: reply, action: executeQueryIcpDefi });
    }
    return true;
  },
};
