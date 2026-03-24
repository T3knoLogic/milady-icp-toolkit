import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from "@elizaos/core";
import { ICP_TOKEN_STANDARDS_SUMMARY } from "../constants/icpStandards";

export const executeQueryIcpStandards: Action = {
  name: "QUERY_ICP_TOKEN_STANDARDS",
  similes: [
    "ICRC_1_EXPLAIN",
    "ICRC_2_EXPLAIN",
    "ICP_NFT_STANDARDS",
    "DIP721",
    "WHAT_IS_ICRC",
  ],
  description:
    "Summarize Internet Computer token standards (ICRC-1/2/3, legacy NFT interfaces, ICRC-7/37) and safe practices for agents. Use when the user asks how IC tokens, approvals, or NFTs work on ICP.",
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message?.content?.text || "").toLowerCase();
    return (
      text.includes("icrc") ||
      text.includes("token standard") ||
      text.includes("dip721") ||
      (text.includes("nft") && text.includes("icp")) ||
      (text.includes("internet computer") && text.includes("token"))
    );
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
    options: { callback?: HandlerCallback },
  ): Promise<boolean> => {
    const callback = options?.callback;
    if (callback) {
      await callback({
        text: ICP_TOKEN_STANDARDS_SUMMARY,
        action: executeQueryIcpStandards,
      });
    }
    return true;
  },
};
