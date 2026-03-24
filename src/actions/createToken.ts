import {
    composePromptFromState,
    ModelType,
    type ActionExample,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
} from "@elizaos/core";
import { idlFactory } from "../canisters/pick-pump/index.did";
import type { _SERVICE } from "../canisters/pick-pump/index.did.d";
import type { ActorCreator, CreateMemeTokenArg } from "../types";
import { unwrapOption, wrapOption } from "../utils/common/types/options";
import { unwrapRustResultMap } from "../utils/common/types/results";
import { icpWalletProvider } from "../providers/wallet";
import { uploadFileToWeb3Storage } from "../apis/uploadFile";
import { createTokenTemplate, logoPromptTemplate } from "./prompts/token";
import { CANISTER_IDS } from "../constants/canisters";

async function createTokenTransaction(
    creator: ActorCreator,
    tokenInfo: CreateMemeTokenArg
) {
    const actor: _SERVICE = await creator(idlFactory, CANISTER_IDS.PICK_PUMP);
    const result = await actor.create_token({
        ...tokenInfo,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        description: tokenInfo.description,
        logo: tokenInfo.logo,
        twitter: wrapOption(tokenInfo.twitter),
        website: wrapOption(tokenInfo.website),
        telegram: wrapOption(tokenInfo.telegram),
    });

    return unwrapRustResultMap(
        result,
        (ok) => ({
            ...ok,
            id: ok.id.toString(),
            created_at: ok.created_at.toString(),
            available_token: ok.available_token.toString(),
            volume_24h: ok.volume_24h.toString(),
            last_tx_time: ok.last_tx_time.toString(),
            market_cap_icp: ok.market_cap_icp.toString(),
            twitter: unwrapOption(ok.twitter),
            website: unwrapOption(ok.website),
            telegram: unwrapOption(ok.telegram),
        }),
        (err) => {
            throw new Error(`Token creation failed: ${err}`);
        }
    );
}

async function generateTokenLogo(
    description: string,
    runtime: IAgentRuntime
): Promise<string | null> {
    const logoPrompt = `Create a fun and memorable logo for a cryptocurrency token with these characteristics: ${description}. The logo should be simple, iconic, and suitable for a meme token. Style: minimal, bold colors, crypto-themed.`;

    try {
        const result = await runtime.useModel(ModelType.IMAGE, {
            prompt: logoPrompt,
            size: "512x512",
            count: 1,
        }) as { url: string }[];

        if (result && result.length > 0 && result[0]?.url) {
            return result[0].url;
        }
    } catch {
        // Image provider may not be configured
    }
    return null;
}

export const executeCreateToken: Action = {
    name: "CREATE_TOKEN",
    similes: [
        "CREATE_PICKPUMP_TOKEN",
        "MINT_PICKPUMP",
        "PICKPUMP_TOKEN",
        "PP_TOKEN",
        "PICKPUMP发币",
        "PP发币",
        "在PICKPUMP上发币",
        "PICKPUMP代币",
    ],
    description:
        "Create a new meme token on PickPump platform (Internet Computer). This action helps users create and launch tokens specifically on the PickPump platform.",
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const keywords = [
            "pickpump",
            "pp",
            "皮克帮",
            "token",
            "coin",
            "代币",
            "币",
            "create",
            "mint",
            "launch",
            "deploy",
            "创建",
            "发行",
            "铸造",
        ];

        const messageText = (
            typeof message.content === "string"
                ? message.content
                : message.content.text || ""
        ).toLowerCase();

        return keywords.some((keyword) =>
            messageText.includes(keyword.toLowerCase())
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        _options: { [key: string]: unknown } | undefined,
        callback?: HandlerCallback
    ): Promise<void> => {
        callback?.({
            text: "🔄 Creating meme token...",
            action: "CREATE_TOKEN",
            type: "processing",
        });

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        const createTokenContext = composePromptFromState({
            state: currentState,
            template: createTokenTemplate,
        });

        const createTokenSchema = {
            type: "object" as const,
            properties: {
                name: { type: "string" },
                symbol: { type: "string" },
                description: { type: "string" },
                logo: { type: "string" },
                website: { type: "string" },
                twitter: { type: "string" },
                telegram: { type: "string" },
            },
            required: ["name", "symbol", "description"],
        };

        const responseRaw = await runtime.useModel(
            ModelType.OBJECT_LARGE,
            {
                prompt: createTokenContext,
                schema: createTokenSchema,
                output: "object",
            }
        );

        let parsed: Record<string, unknown> =
            typeof responseRaw === "object" && responseRaw !== null
                ? (responseRaw as Record<string, unknown>)
                : {};
        if (typeof responseRaw === "string") {
            try {
                const jsonMatch = responseRaw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, responseRaw];
                const jsonStr = jsonMatch[1]?.trim() ?? responseRaw;
                parsed = (JSON.parse(jsonStr) as Record<string, unknown>) ?? {};
            } catch {
                parsed = {};
            }
        }

        const response = {
            name: String(parsed?.name ?? ""),
            symbol: String(parsed?.symbol ?? ""),
            description: String(parsed?.description ?? ""),
        };

        const logoPromptContext = composePromptFromState({
            state: { ...currentState, values: { ...(currentState.values ?? {}), description: response.description } },
            template: logoPromptTemplate,
        });

        const logoPrompt = await runtime.useModel(
            ModelType.TEXT_LARGE,
            { prompt: logoPromptContext }
        ) as string;

        const logo = await generateTokenLogo(logoPrompt, runtime);
        if (!logo) {
            throw new Error("Failed to generate token logo");
        }

        const logoUploadResult = await uploadFileToWeb3Storage(logo);
        if (!logoUploadResult.urls?.gateway) {
            throw new Error("Failed to upload logo to Web3Storage");
        }

        try {
            const { wallet } = await icpWalletProvider.get(
                runtime,
                message,
                state
            );

            const creator = wallet.createActor;
            const createTokenResult = await createTokenTransaction(creator, {
                name: response.name,
                symbol: response.symbol,
                description: response.description,
                logo: logoUploadResult.urls.gateway,
            });

            const responseMsg = {
                text: `✨ Created new meme token:\n🪙 ${response.name} (${response.symbol})\n📝 ${response.description}`,
                data: createTokenResult,
                action: "CREATE_TOKEN",
                type: "success",
            };
            callback?.(responseMsg);
        } catch (error: unknown) {
            const responseMsg = {
                text: `Failed to create token: ${error instanceof Error ? error.message : "Unknown error"}`,
                action: "CREATE_TOKEN",
                type: "error",
            };
            callback?.(responseMsg);
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: "I want to create a space cat token on PickPump",
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Creating space cat token on PickPump...",
                    action: "CREATE_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "✨ Token created successfully!",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: "Help me create a pizza-themed funny token on PP",
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Creating pizza token on PickPump...",
                    action: "CREATE_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
