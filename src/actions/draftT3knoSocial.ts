import {
    composePromptFromState,
    ModelType,
    type Action,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { loadT3knoKnowledge, validateProductMentions } from "../knowledge/t3kno";

export const executeDraftT3knoSocial: Action = {
    name: "DRAFT_T3KNO_SOCIAL",
    similes: [
        "DRAFT_TWEET",
        "DRAFT_DISCORD_POST",
        "T3KNO_SOCIAL",
        "SOCIAL_POST_DRAFT",
    ],
    description:
        "Draft a Twitter or Discord post for a T3kNo-Logic product (NFT Matrix, Machina, Bonsai Widget, Bazaar). Uses product knowledge; includes correct links. Max 280 chars for Twitter, 500 for Discord.",
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = (message?.content?.text || "").toLowerCase();
        const keywords = [
            "draft",
            "tweet",
            "post",
            "discord",
            "social",
            "announce",
            "promote",
            "nft matrix",
            "machina",
            "bazaar",
            "bonsai",
        ];
        return keywords.some((k) => text.includes(k));
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { callback?: HandlerCallback }
    ): Promise<boolean> => {
        const callback = options?.callback;
        const text = (message?.content?.text || "").toLowerCase();
        const channel = text.includes("discord") ? "discord" : "twitter";
        const maxLen = channel === "twitter" ? 280 : 500;

        const productMatch =
            text.includes("nft matrix") ? "NFT Matrix" :
            text.includes("machina") ? "Machina" :
            text.includes("bonsai widget") ? "Bonsai Widget" :
            text.includes("bazaar") || text.includes("t3kno-logic") ? "Bazaar" :
            "NFT Matrix"; // default

        try {
            const knowledge = loadT3knoKnowledge();
            const template = `You are drafting a ${channel} post for T3kNo-Logic.

PRODUCT KNOWLEDGE:
${knowledge}

PRODUCT: ${productMatch}

Requirements:
- ${channel === "twitter" ? "Max 280 chars. Punchy, one clear thought." : "Max 500 chars. Slightly more conversational."}
- Include product link from knowledge
- Do NOT confuse NFT Matrix (NFT generator) with Bonsai Widget (streaming player)
- No hashtag spam
- Output ONLY the post text, no meta-commentary`;

            const currentState = state ?? (await runtime.composeState(message)) as State;
            const ctx = composePromptFromState({
                state: currentState,
                template,
            });

            const draft = await runtime.useModel(
                ModelType.TEXT_SMALL,
                { prompt: ctx }
            ) as string;

            let contentTrimmed = (draft || "").trim();
            if (contentTrimmed.length > maxLen) {
                contentTrimmed = contentTrimmed.slice(0, maxLen - 3) + "...";
            }

            const validation = validateProductMentions(contentTrimmed);
            if (!validation.valid) {
                contentTrimmed += " [Flags: " + validation.confusions.join("; ") + "]";
            }

            const reply = `**Draft ${channel} post for ${productMatch}:**\n\n${contentTrimmed}`;

            if (callback) {
                await callback({
                    text: reply,
                    action: executeDraftT3knoSocial,
                });
            }
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const fallback: Record<string, string> = {
                "NFT Matrix": `NFT Matrix — professional NFT creation. 28+ chains, 1–10k NFTs, local. $99. https://thenftmatrix.gumroad.com/l/fruzgy`,
                Machina: `Machina VST3 — bio-cyber synth for producers. $29. https://thenftmatrix.gumroad.com/l/mzkks`,
                "Bonsai Widget": `Free Bonsai Radio streaming widget for Twitch/web. OBS-ready. https://thenftmatrix.gumroad.com/l/hrebyq`,
                Bazaar: `T3kNo-Logic merch & Bonsai Collective. RWA-certified. Free NFT airdrop. https://t3kno-logic.xyz`,
            };
            const content = fallback[productMatch] ?? `Draft for ${productMatch}. Add GEMINI_API_KEY for AI drafts.`;
            if (callback) {
                await callback({
                    text: `**Fallback draft:** ${content}\n\n(Error: ${msg})`,
                    action: executeDraftT3knoSocial,
                });
            }
        }
        return false;
    },
};
