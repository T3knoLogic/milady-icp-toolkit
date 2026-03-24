import {
    type Action,
    type ActionExample,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { idlFactory as walletIdlFactory } from "../canisters/launchpad-wallet/index.did";
import { idlFactory as registryIdlFactory } from "../canisters/launchpad-registry/index.did";
import { createAnonymousActor } from "../providers/wallet";
import { LAUNCHPAD_CANISTERS } from "../constants/canisters";

const ICP_HOST = process.env.ICP_HOST || "https://mainnet.dfinity.network";

export const executeQueryLaunchpad: Action = {
    name: "QUERY_ICP_LAUNCHPAD",
    similes: [
        "LAUNCHPAD_BALANCE",
        "LAUNCHPAD_CYCLES",
        "LIST_LAUNCHPAD_CANISTERS",
        "QUERY_ICP_REGISTRY",
        "ICP_CANISTERS",
        "LAUNCHPAD_REGISTRY",
        "CHECK_CYCLES",
    ],
    description:
        "Query the ICP Launchpad: get wallet cycles balance or list registered canisters on the IC mainnet. Use when the user asks about cycles, balance, registered canisters, or the Launchpad registry.",
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = (message?.content?.text || "").toLowerCase();
        const keywords = [
            "launchpad",
            "cycles",
            "balance",
            "canister",
            "registry",
            "registered",
            "icp",
            "mainnet",
            "wallet",
        ];
        return keywords.some((k) => text.includes(k));
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { callback?: HandlerCallback }
    ): Promise<boolean> => {
        const callback = options?.callback;
        const text = (message?.content?.text || "").toLowerCase();
        const wantsBalance =
            text.includes("balance") ||
            text.includes("cycles") ||
            text.includes("wallet");
        const wantsRegistry =
            text.includes("registry") ||
            text.includes("canister") ||
            text.includes("registered") ||
            text.includes("list");

        try {
            if (wantsBalance && !wantsRegistry) {
                const walletActor = await createAnonymousActor(
                    walletIdlFactory,
                    LAUNCHPAD_CANISTERS.WALLET,
                    ICP_HOST,
                    false
                );
                const balance = (await (walletActor as any).get_balance()) as bigint;
                const cycles = Number(balance) / 1e12;
                const reply = `The ICP Launchpad wallet has **${cycles.toFixed(2)} T cycles** (${balance.toString()} raw).`;
                if (callback) {
                    await callback({
                        text: reply,
                        action: executeQueryLaunchpad,
                    });
                }
                return true;
            }

            if (wantsRegistry || (!wantsBalance && !wantsRegistry)) {
                const registryActor = await createAnonymousActor(
                    registryIdlFactory,
                    LAUNCHPAD_CANISTERS.REGISTRY,
                    ICP_HOST,
                    false
                );
                const list = (await (registryActor as any).list_all()) as Array<{
                    id: { toText?: () => string } | string;
                    name: string;
                    network: string;
                }>;
                const items = list.map((c) => {
                    const idStr =
                        typeof c.id === "string"
                            ? c.id
                            : (c.id as { toText: () => string })?.toText?.() ?? String(c.id);
                    return `- **${c.name}** — \`${idStr}\` (${c.network})`;
                });
                const reply =
                    items.length > 0
                        ? `Registered canisters on ICP Launchpad:\n\n${items.join("\n")}`
                        : "No canisters registered yet.";
                if (callback) {
                    await callback({
                        text: reply,
                        action: executeQueryLaunchpad,
                    });
                }
                return true;
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (callback) {
                await callback({
                    text: `Failed to query Launchpad: ${msg}`,
                    action: executeQueryLaunchpad,
                });
            }
        }
        return false;
    },
};
