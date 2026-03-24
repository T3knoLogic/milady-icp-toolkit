import {
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { loadT3knoKnowledge } from "../knowledge/t3kno";

export const executeQueryT3knoProducts: Action = {
    name: "QUERY_T3KNO_PRODUCTS",
    similes: [
        "T3KNO_PRODUCTS",
        "NFT_MATRIX",
        "MACHINA",
        "BAZAAR",
        "BONSAI_WIDGET",
        "T3KNO_LOGIC",
        "PRODUCT_INFO",
    ],
    description:
        "When the user asks about T3kNo-Logic products (NFT Matrix, Machina, Bonsai Widget, Bazaar, t3kno-logic.xyz), return accurate product info with links. Do NOT confuse NFT Matrix (NFT generator) with Bonsai Widget (streaming player).",
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = (message?.content?.text || "").toLowerCase();
        const keywords = [
            "nft matrix",
            "machina",
            "bonsai widget",
            "bazaar",
            "t3kno",
            "t3kno-logic",
            "gumroad",
            "enchanted bonsai",
        ];
        return keywords.some((k) => text.includes(k));
    },
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        options: { callback?: HandlerCallback }
    ): Promise<boolean> => {
        const callback = options?.callback;
        try {
            const knowledge = loadT3knoKnowledge();
            const reply = `Here's the T3kNo-Logic product info:\n\n${knowledge}\n\n**One-line pitches:**\n- NFT Matrix: "Professional NFT creation. One app, $99, 28+ chains, 1–10k NFTs, local."\n- Machina: "Bio-cyber synth for electronic producers. $29, VST3."\n- Bonsai Widget: "Free Bonsai Radio player for streams and web. OBS-ready, MIT."\n- Bazaar: "T3kNo-Logic & Bonsai Collective merch. RWA-certified; free NFT airdrop with purchase."`;

            if (callback) {
                await callback({
                    text: reply,
                    action: executeQueryT3knoProducts,
                });
            }
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (callback) {
                await callback({
                    text: `Could not load product info: ${msg}`,
                    action: executeQueryT3knoProducts,
                });
            }
        }
        return false;
    },
};
