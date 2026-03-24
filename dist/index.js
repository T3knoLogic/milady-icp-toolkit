// src/providers/wallet.ts
import { Actor, HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
var WalletProvider = class {
  privateKey;
  identity;
  host;
  constructor(privateKey, host = "https://ic0.app") {
    this.privateKey = privateKey;
    this.host = host;
    this.identity = this.createIdentity();
  }
  createIdentity = () => {
    if (!this.privateKey) {
      throw new Error("Private key is required");
    }
    try {
      const privateKeyBytes = Buffer.from(this.privateKey, "hex");
      if (privateKeyBytes.length !== 32) {
        throw new Error("Invalid private key length");
      }
      const arrayBuffer = privateKeyBytes.buffer.slice(
        privateKeyBytes.byteOffset,
        privateKeyBytes.byteOffset + privateKeyBytes.length
      );
      return Ed25519KeyIdentity.fromSecretKey(arrayBuffer);
    } catch {
      throw new Error("Failed to create ICP identity");
    }
  };
  createAgent = async () => {
    return HttpAgent.create({
      identity: this.identity,
      host: this.host
    });
  };
  getIdentity = () => {
    return this.identity;
  };
  getPrincipal = () => {
    return this.identity.getPrincipal();
  };
  createActor = async (idlFactory5, canisterId, fetchRootKey = false) => {
    const agent = await this.createAgent();
    if (fetchRootKey) {
      await agent.fetchRootKey();
    }
    return Actor.createActor(idlFactory5, {
      agent,
      canisterId
    });
  };
};
var icpWalletProvider = {
  async get(runtime, _message, _state) {
    try {
      const privateKey = runtime.getSetting(
        "INTERNET_COMPUTER_PRIVATE_KEY"
      );
      if (!privateKey) {
        throw new Error("INTERNET_COMPUTER_PRIVATE_KEY not found");
      }
      const wallet = new WalletProvider(privateKey);
      return {
        wallet,
        identity: wallet.getIdentity(),
        principal: wallet.getPrincipal().toString(),
        isAuthenticated: true,
        createActor: wallet.createActor
      };
    } catch (error) {
      return {
        wallet: null,
        identity: null,
        principal: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var createAnonymousActor = async (idlFactory5, canisterId, host = "https://ic0.app", fetchRootKey = false) => {
  const anonymousAgent = new HttpAgent({
    host,
    retryTimes: 1,
    verifyQuerySignatures: false
  });
  if (fetchRootKey) {
    await anonymousAgent.fetchRootKey();
  }
  return Actor.createActor(idlFactory5, {
    agent: anonymousAgent,
    canisterId
  });
};

// src/actions/createToken.ts
import {
  composePromptFromState,
  ModelType
} from "@elizaos/core";

// src/canisters/pick-pump/index.did.ts
var idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text });
  const CreateMemeTokenArg = IDL.Record({
    twitter: IDL.Opt(IDL.Text),
    logo: IDL.Text,
    name: IDL.Text,
    description: IDL.Text,
    website: IDL.Opt(IDL.Text),
    telegram: IDL.Opt(IDL.Text),
    symbol: IDL.Text
  });
  const MemeToken = IDL.Record({
    id: IDL.Nat64,
    creator: IDL.Text,
    available_token: IDL.Nat,
    twitter: IDL.Opt(IDL.Text),
    volume_24h: IDL.Nat,
    logo: IDL.Text,
    name: IDL.Text,
    liquidity: IDL.Float64,
    description: IDL.Text,
    created_at: IDL.Nat64,
    website: IDL.Opt(IDL.Text),
    last_tx_time: IDL.Nat64,
    canister: IDL.Opt(IDL.Text),
    market_cap_icp: IDL.Nat,
    market_cap_usd: IDL.Float64,
    price: IDL.Float64,
    telegram: IDL.Opt(IDL.Text),
    symbol: IDL.Text
  });
  const Result_1 = IDL.Variant({ Ok: MemeToken, Err: IDL.Text });
  const Transaction = IDL.Record({
    token_amount: IDL.Nat,
    token_id: IDL.Nat64,
    token_symbol: IDL.Text,
    from: IDL.Text,
    timestamp: IDL.Nat64,
    icp_amount: IDL.Nat,
    tx_type: IDL.Text
  });
  const CreateCommentArg = IDL.Record({
    token: IDL.Text,
    content: IDL.Text,
    image: IDL.Opt(IDL.Text)
  });
  const Sort = IDL.Variant({
    CreateTimeDsc: IDL.Null,
    LastTradeDsc: IDL.Null,
    MarketCapDsc: IDL.Null
  });
  const Candle = IDL.Record({
    low: IDL.Float64,
    high: IDL.Float64,
    close: IDL.Float64,
    open: IDL.Float64,
    timestamp: IDL.Nat64
  });
  const Comment = IDL.Record({
    creator: IDL.Text,
    token: IDL.Text,
    content: IDL.Text,
    created_at: IDL.Nat64,
    image: IDL.Opt(IDL.Text)
  });
  const Holder = IDL.Record({ balance: IDL.Nat, owner: IDL.Text });
  const User = IDL.Record({
    principal: IDL.Text,
    name: IDL.Text,
    last_login_seconds: IDL.Nat64,
    register_at_second: IDL.Nat64,
    avatar: IDL.Text
  });
  const MemeTokenView = IDL.Record({
    token: MemeToken,
    balance: IDL.Nat
  });
  const WalletReceiveResult = IDL.Record({ accepted: IDL.Nat64 });
  return IDL.Service({
    buy: IDL.Func([IDL.Nat64, IDL.Float64], [Result], []),
    calculate_buy: IDL.Func([IDL.Nat64, IDL.Float64], [Result], ["query"]),
    calculate_sell: IDL.Func([IDL.Nat64, IDL.Float64], [Result], ["query"]),
    create_token: IDL.Func([CreateMemeTokenArg], [Result_1], []),
    king_of_hill: IDL.Func([], [IDL.Opt(MemeToken)], ["query"]),
    last_txs: IDL.Func([IDL.Nat64], [IDL.Vec(Transaction)], ["query"]),
    post_comment: IDL.Func([CreateCommentArg], [], []),
    query_all_tokens: IDL.Func(
      [IDL.Nat64, IDL.Nat64, IDL.Opt(Sort)],
      [IDL.Vec(MemeToken), IDL.Nat64],
      ["query"]
    ),
    query_token: IDL.Func([IDL.Nat64], [IDL.Opt(MemeToken)], ["query"]),
    query_token_candle: IDL.Func(
      [IDL.Nat64, IDL.Opt(IDL.Nat64)],
      [IDL.Vec(Candle)],
      ["query"]
    ),
    query_token_comments: IDL.Func(
      [IDL.Principal, IDL.Nat64, IDL.Nat64],
      [IDL.Vec(Comment), IDL.Nat64],
      ["query"]
    ),
    query_token_holders: IDL.Func(
      [IDL.Nat64, IDL.Nat64, IDL.Nat64],
      [IDL.Vec(Holder), IDL.Nat64],
      ["query"]
    ),
    query_token_transactions: IDL.Func(
      [IDL.Nat64, IDL.Nat64, IDL.Nat64],
      [IDL.Vec(Transaction), IDL.Nat64],
      ["query"]
    ),
    query_user: IDL.Func([IDL.Opt(IDL.Principal)], [User], ["query"]),
    query_user_launched: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [IDL.Vec(MemeToken)],
      ["query"]
    ),
    query_user_tokens: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [IDL.Vec(MemeTokenView)],
      ["query"]
    ),
    sell: IDL.Func([IDL.Nat64, IDL.Float64], [Result], []),
    wallet_balance: IDL.Func([], [IDL.Nat], ["query"]),
    wallet_receive: IDL.Func([], [WalletReceiveResult], [])
  });
};

// src/utils/common/types/options.ts
var unwrapOption = (v) => v.length ? v[0] : void 0;
var wrapOption = (v) => v !== void 0 ? [v] : [];

// src/utils/ic/principals.ts
import { Principal } from "@dfinity/principal";
var isPrincipalText = (text) => {
  if (!text) return false;
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
};

// src/utils/common/data/json.ts
var customStringify = (v) => JSON.stringify(v, (_key, value) => {
  if (typeof value === "bigint") {
    return `${value}`;
  } else if (value && typeof value === "object" && value._isPrincipal === true) {
    return value.toText();
  } else if (value && typeof value === "object" && value.__principal__ && isPrincipalText(value.__principal__)) {
    return value.__principal__;
  }
  return value;
});

// src/utils/common/types/results.ts
var unwrapRustResultMap = (result, transform_ok, transform_err) => {
  if (result.Ok !== void 0) return transform_ok(result.Ok);
  if (result.Err !== void 0) return transform_err(result.Err);
  throw new Error(`wrong rust result: ${customStringify(result)}`);
};

// src/constants/apis.ts
var WEB3_STORAGE_API_HOST = "";

// src/apis/uploadFile.ts
async function uploadFileToWeb3Storage(base64Data, fileName = "image.png") {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });
    const file = new File([blob], fileName, { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(WEB3_STORAGE_API_HOST, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "upload failed"
    };
  }
}

// src/actions/prompts/token.ts
var createTokenTemplate = `Based on the user's description, generate creative and memorable values for a new meme token on PickPump:

User's idea: "{{recentMessages}}"

Please generate:
1. A catchy and fun token name that reflects the theme
2. A 3-4 letter symbol based on the name (all caps)
3. An engaging and humorous description (include emojis)
4. Set other fields to null

Example response:
\`\`\`json
{
    "name": "CatLaser",
    "symbol": "PAWS",
    "description": "The first meme token powered by feline laser-chasing energy! Watch your investment zoom around like a red dot! \u{1F63A}\u{1F534}\u2728",
    "logo": null,
    "website": null,
    "twitter": null,
    "telegram": null
}
\`\`\`

Generate appropriate meme token information based on the user's description.
Respond with a JSON markdown block containing only the generated values.`;
var logoPromptTemplate = `Based on this token idea: "{{description}}", create a detailed prompt for generating a logo image.
The prompt should describe visual elements, style, and mood for the logo.
Focus on making it memorable and suitable for a cryptocurrency token.
Keep the response short and specific.
Respond with only the prompt text, no additional formatting.

Example for a dog-themed token:
"A playful cartoon dog face with a cryptocurrency symbol on its collar, using vibrant colors and bold outlines, crypto-themed minimal style"`;

// src/constants/canisters.ts
var CANISTER_IDS = {
  PICK_PUMP: "tl65e-yyaaa-aaaah-aq2pa-cai"
};
var LAUNCHPAD_CANISTERS = {
  WALLET: "tw5ow-tiaaa-aaaau-afpha-cai",
  REGISTRY: "t76fk-faaaa-aaaau-afpgq-cai",
  INTEGRATIONS: "ty7d6-iyaaa-aaaau-afpga-cai",
  FRONTEND: "tnyst-jqaaa-aaaau-afpfq-cai"
};

// src/actions/createToken.ts
async function createTokenTransaction(creator, tokenInfo) {
  const actor = await creator(idlFactory, CANISTER_IDS.PICK_PUMP);
  const result = await actor.create_token({
    ...tokenInfo,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    description: tokenInfo.description,
    logo: tokenInfo.logo,
    twitter: wrapOption(tokenInfo.twitter),
    website: wrapOption(tokenInfo.website),
    telegram: wrapOption(tokenInfo.telegram)
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
      telegram: unwrapOption(ok.telegram)
    }),
    (err) => {
      throw new Error(`Token creation failed: ${err}`);
    }
  );
}
async function generateTokenLogo(description, runtime) {
  var _a;
  const logoPrompt = `Create a fun and memorable logo for a cryptocurrency token with these characteristics: ${description}. The logo should be simple, iconic, and suitable for a meme token. Style: minimal, bold colors, crypto-themed.`;
  try {
    const result = await runtime.useModel(ModelType.IMAGE, {
      prompt: logoPrompt,
      size: "512x512",
      count: 1
    });
    if (result && result.length > 0 && ((_a = result[0]) == null ? void 0 : _a.url)) {
      return result[0].url;
    }
  } catch {
  }
  return null;
}
var executeCreateToken = {
  name: "CREATE_TOKEN",
  similes: [
    "CREATE_PICKPUMP_TOKEN",
    "MINT_PICKPUMP",
    "PICKPUMP_TOKEN",
    "PP_TOKEN",
    "PICKPUMP\u53D1\u5E01",
    "PP\u53D1\u5E01",
    "\u5728PICKPUMP\u4E0A\u53D1\u5E01",
    "PICKPUMP\u4EE3\u5E01"
  ],
  description: "Create a new meme token on PickPump platform (Internet Computer). This action helps users create and launch tokens specifically on the PickPump platform.",
  validate: async (_runtime, message) => {
    const keywords = [
      "pickpump",
      "pp",
      "\u76AE\u514B\u5E2E",
      "token",
      "coin",
      "\u4EE3\u5E01",
      "\u5E01",
      "create",
      "mint",
      "launch",
      "deploy",
      "\u521B\u5EFA",
      "\u53D1\u884C",
      "\u94F8\u9020"
    ];
    const messageText = (typeof message.content === "string" ? message.content : message.content.text || "").toLowerCase();
    return keywords.some(
      (keyword) => messageText.includes(keyword.toLowerCase())
    );
  },
  handler: async (runtime, message, state, _options, callback) => {
    var _a, _b;
    callback == null ? void 0 : callback({
      text: "\u{1F504} Creating meme token...",
      action: "CREATE_TOKEN",
      type: "processing"
    });
    let currentState = state;
    if (!currentState) {
      currentState = await runtime.composeState(message);
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }
    const createTokenContext = composePromptFromState({
      state: currentState,
      template: createTokenTemplate
    });
    const createTokenSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        symbol: { type: "string" },
        description: { type: "string" },
        logo: { type: "string" },
        website: { type: "string" },
        twitter: { type: "string" },
        telegram: { type: "string" }
      },
      required: ["name", "symbol", "description"]
    };
    const responseRaw = await runtime.useModel(
      ModelType.OBJECT_LARGE,
      {
        prompt: createTokenContext,
        schema: createTokenSchema,
        output: "object"
      }
    );
    let parsed = typeof responseRaw === "object" && responseRaw !== null ? responseRaw : {};
    if (typeof responseRaw === "string") {
      try {
        const jsonMatch = responseRaw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, responseRaw];
        const jsonStr = ((_a = jsonMatch[1]) == null ? void 0 : _a.trim()) ?? responseRaw;
        parsed = JSON.parse(jsonStr) ?? {};
      } catch {
        parsed = {};
      }
    }
    const response = {
      name: String((parsed == null ? void 0 : parsed.name) ?? ""),
      symbol: String((parsed == null ? void 0 : parsed.symbol) ?? ""),
      description: String((parsed == null ? void 0 : parsed.description) ?? "")
    };
    const logoPromptContext = composePromptFromState({
      state: { ...currentState, values: { ...currentState.values ?? {}, description: response.description } },
      template: logoPromptTemplate
    });
    const logoPrompt = await runtime.useModel(
      ModelType.TEXT_LARGE,
      { prompt: logoPromptContext }
    );
    const logo = await generateTokenLogo(logoPrompt, runtime);
    if (!logo) {
      throw new Error("Failed to generate token logo");
    }
    const logoUploadResult = await uploadFileToWeb3Storage(logo);
    if (!((_b = logoUploadResult.urls) == null ? void 0 : _b.gateway)) {
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
        logo: logoUploadResult.urls.gateway
      });
      const responseMsg = {
        text: `\u2728 Created new meme token:
\u{1FA99} ${response.name} (${response.symbol})
\u{1F4DD} ${response.description}`,
        data: createTokenResult,
        action: "CREATE_TOKEN",
        type: "success"
      };
      callback == null ? void 0 : callback(responseMsg);
    } catch (error) {
      const responseMsg = {
        text: `Failed to create token: ${error instanceof Error ? error.message : "Unknown error"}`,
        action: "CREATE_TOKEN",
        type: "error"
      };
      callback == null ? void 0 : callback(responseMsg);
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: "I want to create a space cat token on PickPump"
      },
      {
        user: "{{user2}}",
        content: {
          text: "Creating space cat token on PickPump...",
          action: "CREATE_TOKEN"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "\u2728 Token created successfully!"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: "Help me create a pizza-themed funny token on PP"
      },
      {
        user: "{{user2}}",
        content: {
          text: "Creating pizza token on PickPump...",
          action: "CREATE_TOKEN"
        }
      }
    ]
  ]
};

// src/canisters/launchpad-wallet/index.did.ts
var idlFactory2 = ({ IDL }) => {
  const Result = IDL.Variant({ ok: IDL.Principal, err: IDL.Text });
  const Result_1 = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const DepositResponse = IDL.Record({ accepted: IDL.Nat });
  const TopUpResponse = IDL.Record({ accepted: IDL.Nat64 });
  return IDL.Service({
    create_canister_with_cycles: IDL.Func([IDL.Nat, IDL.Opt(IDL.Vec(IDL.Principal))], [Result], []),
    deposit: IDL.Func([], [DepositResponse], []),
    get_balance: IDL.Func([], [IDL.Nat], ["query"]),
    top_up: IDL.Func([IDL.Principal, IDL.Nat], [Result_1], []),
    wallet_receive: IDL.Func([], [TopUpResponse], []),
    whoami: IDL.Func([], [IDL.Principal], ["query"])
  });
};

// src/canisters/launchpad-registry/index.did.ts
var idlFactory3 = ({ IDL }) => {
  const CanisterInfo = IDL.Record({
    created_at: IDL.Int,
    id: IDL.Principal,
    name: IDL.Text,
    network: IDL.Text,
    owner: IDL.Principal
  });
  const Result = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  return IDL.Service({
    get: IDL.Func([IDL.Principal], [IDL.Opt(CanisterInfo)], ["query"]),
    list_all: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
    list_mine: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
    register: IDL.Func([IDL.Principal, IDL.Text, IDL.Text], [Result], []),
    unregister: IDL.Func([IDL.Principal], [Result], []),
    update_name: IDL.Func([IDL.Principal, IDL.Text], [Result], [])
  });
};

// src/actions/queryLaunchpad.ts
var ICP_HOST = process.env.ICP_HOST || "https://mainnet.dfinity.network";
var executeQueryLaunchpad = {
  name: "QUERY_ICP_LAUNCHPAD",
  similes: [
    "LAUNCHPAD_BALANCE",
    "LAUNCHPAD_CYCLES",
    "LIST_LAUNCHPAD_CANISTERS",
    "QUERY_ICP_REGISTRY",
    "ICP_CANISTERS",
    "LAUNCHPAD_REGISTRY",
    "CHECK_CYCLES"
  ],
  description: "Query the ICP Launchpad: get wallet cycles balance or list registered canisters on the IC mainnet. Use when the user asks about cycles, balance, registered canisters, or the Launchpad registry.",
  validate: async (_runtime, message) => {
    var _a;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    const keywords = [
      "launchpad",
      "cycles",
      "balance",
      "canister",
      "registry",
      "registered",
      "icp",
      "mainnet",
      "wallet"
    ];
    return keywords.some((k) => text.includes(k));
  },
  handler: async (runtime, message, _state, options) => {
    var _a;
    const callback = options == null ? void 0 : options.callback;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    const wantsBalance = text.includes("balance") || text.includes("cycles") || text.includes("wallet");
    const wantsRegistry = text.includes("registry") || text.includes("canister") || text.includes("registered") || text.includes("list");
    try {
      if (wantsBalance && !wantsRegistry) {
        const walletActor = await createAnonymousActor(
          idlFactory2,
          LAUNCHPAD_CANISTERS.WALLET,
          ICP_HOST,
          false
        );
        const balance = await walletActor.get_balance();
        const cycles = Number(balance) / 1e12;
        const reply = `The ICP Launchpad wallet has **${cycles.toFixed(2)} T cycles** (${balance.toString()} raw).`;
        if (callback) {
          await callback({
            text: reply,
            action: executeQueryLaunchpad
          });
        }
        return true;
      }
      if (wantsRegistry || !wantsBalance && !wantsRegistry) {
        const registryActor = await createAnonymousActor(
          idlFactory3,
          LAUNCHPAD_CANISTERS.REGISTRY,
          ICP_HOST,
          false
        );
        const list = await registryActor.list_all();
        const items = list.map((c) => {
          var _a2, _b;
          const idStr = typeof c.id === "string" ? c.id : ((_b = (_a2 = c.id) == null ? void 0 : _a2.toText) == null ? void 0 : _b.call(_a2)) ?? String(c.id);
          return `- **${c.name}** \u2014 \`${idStr}\` (${c.network})`;
        });
        const reply = items.length > 0 ? `Registered canisters on ICP Launchpad:

${items.join("\n")}` : "No canisters registered yet.";
        if (callback) {
          await callback({
            text: reply,
            action: executeQueryLaunchpad
          });
        }
        return true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Failed to query Launchpad: ${msg}`,
          action: executeQueryLaunchpad
        });
      }
    }
    return false;
  }
};

// src/knowledge/t3kno.ts
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
var _dir = dirname(fileURLToPath(import.meta.url));
var pluginRoot = resolve(_dir, "..", "..");
var repoRoot = resolve(pluginRoot, "..");
var KNOWN_PATHS = [
  resolve(process.cwd(), "knowledge", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
  resolve(process.cwd(), "../knowledge", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
  resolve(process.cwd(), "../../T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
  resolve(repoRoot, "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
  resolve(pluginRoot, "..", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md")
];
function loadT3knoKnowledge() {
  for (const p of KNOWN_PATHS) {
    if (existsSync(p)) {
      return readFileSync(p, "utf-8");
    }
  }
  return FALLBACK_KNOWLEDGE;
}
var FALLBACK_KNOWLEDGE = `
# T3kNo-Logic Products (fallback)

- **NFT Matrix**: $99, 28+ chains, 1\u201310k NFTs, local desktop app. https://thenftmatrix.gumroad.com/l/fruzgy
- **Machina**: $29, VST3 synth/sequencer. https://thenftmatrix.gumroad.com/l/mzkks
- **Bonsai-Radio.xyz Widget**: Free, OBS-ready streaming player. https://thenftmatrix.gumroad.com/l/hrebyq
- **Bazaar** (t3kno-logic.xyz): Merch store, RWA airdrop, Bonsai Collective. https://t3kno-logic.xyz

**Critical:** NFT Matrix = NFT generator app. Bonsai Widget = streaming player. Different products.
`;
function validateProductMentions(text) {
  const confusions = [];
  const lower = text.toLowerCase();
  if (lower.includes("nft matrix") && lower.includes("streaming")) {
    confusions.push("NFT Matrix is the NFT generator app, NOT the streaming widget.");
  }
  if (lower.includes("bonsai widget") && lower.includes("nft generator")) {
    confusions.push("Bonsai Widget is the streaming player, NOT the NFT generator.");
  }
  return { valid: confusions.length === 0, confusions };
}

// src/actions/queryT3knoProducts.ts
var executeQueryT3knoProducts = {
  name: "QUERY_T3KNO_PRODUCTS",
  similes: [
    "T3KNO_PRODUCTS",
    "NFT_MATRIX",
    "MACHINA",
    "BAZAAR",
    "BONSAI_WIDGET",
    "T3KNO_LOGIC",
    "PRODUCT_INFO"
  ],
  description: "When the user asks about T3kNo-Logic products (NFT Matrix, Machina, Bonsai Widget, Bazaar, t3kno-logic.xyz), return accurate product info with links. Do NOT confuse NFT Matrix (NFT generator) with Bonsai Widget (streaming player).",
  validate: async (_runtime, message) => {
    var _a;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    const keywords = [
      "nft matrix",
      "machina",
      "bonsai widget",
      "bazaar",
      "t3kno",
      "t3kno-logic",
      "gumroad",
      "enchanted bonsai"
    ];
    return keywords.some((k) => text.includes(k));
  },
  handler: async (_runtime, _message, _state, options) => {
    const callback = options == null ? void 0 : options.callback;
    try {
      const knowledge = loadT3knoKnowledge();
      const reply = `Here's the T3kNo-Logic product info:

${knowledge}

**One-line pitches:**
- NFT Matrix: "Professional NFT creation. One app, $99, 28+ chains, 1\u201310k NFTs, local."
- Machina: "Bio-cyber synth for electronic producers. $29, VST3."
- Bonsai Widget: "Free Bonsai Radio player for streams and web. OBS-ready, MIT."
- Bazaar: "T3kNo-Logic & Bonsai Collective merch. RWA-certified; free NFT airdrop with purchase."`;
      if (callback) {
        await callback({
          text: reply,
          action: executeQueryT3knoProducts
        });
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Could not load product info: ${msg}`,
          action: executeQueryT3knoProducts
        });
      }
    }
    return false;
  }
};

// src/actions/draftT3knoSocial.ts
import {
  composePromptFromState as composePromptFromState2,
  ModelType as ModelType2
} from "@elizaos/core";
var executeDraftT3knoSocial = {
  name: "DRAFT_T3KNO_SOCIAL",
  similes: [
    "DRAFT_TWEET",
    "DRAFT_DISCORD_POST",
    "T3KNO_SOCIAL",
    "SOCIAL_POST_DRAFT"
  ],
  description: "Draft a Twitter or Discord post for a T3kNo-Logic product (NFT Matrix, Machina, Bonsai Widget, Bazaar). Uses product knowledge; includes correct links. Max 280 chars for Twitter, 500 for Discord.",
  validate: async (_runtime, message) => {
    var _a;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
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
      "bonsai"
    ];
    return keywords.some((k) => text.includes(k));
  },
  handler: async (runtime, message, state, options) => {
    var _a;
    const callback = options == null ? void 0 : options.callback;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    const channel = text.includes("discord") ? "discord" : "twitter";
    const maxLen = channel === "twitter" ? 280 : 500;
    const productMatch = text.includes("nft matrix") ? "NFT Matrix" : text.includes("machina") ? "Machina" : text.includes("bonsai widget") ? "Bonsai Widget" : text.includes("bazaar") || text.includes("t3kno-logic") ? "Bazaar" : "NFT Matrix";
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
      const currentState = state ?? await runtime.composeState(message);
      const ctx = composePromptFromState2({
        state: currentState,
        template
      });
      const draft = await runtime.useModel(
        ModelType2.TEXT_SMALL,
        { prompt: ctx }
      );
      let contentTrimmed = (draft || "").trim();
      if (contentTrimmed.length > maxLen) {
        contentTrimmed = contentTrimmed.slice(0, maxLen - 3) + "...";
      }
      const validation = validateProductMentions(contentTrimmed);
      if (!validation.valid) {
        contentTrimmed += " [Flags: " + validation.confusions.join("; ") + "]";
      }
      const reply = `**Draft ${channel} post for ${productMatch}:**

${contentTrimmed}`;
      if (callback) {
        await callback({
          text: reply,
          action: executeDraftT3knoSocial
        });
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const fallback = {
        "NFT Matrix": `NFT Matrix \u2014 professional NFT creation. 28+ chains, 1\u201310k NFTs, local. $99. https://thenftmatrix.gumroad.com/l/fruzgy`,
        Machina: `Machina VST3 \u2014 bio-cyber synth for producers. $29. https://thenftmatrix.gumroad.com/l/mzkks`,
        "Bonsai Widget": `Free Bonsai Radio streaming widget for Twitch/web. OBS-ready. https://thenftmatrix.gumroad.com/l/hrebyq`,
        Bazaar: `T3kNo-Logic merch & Bonsai Collective. RWA-certified. Free NFT airdrop. https://t3kno-logic.xyz`
      };
      const content = fallback[productMatch] ?? `Draft for ${productMatch}. Add GEMINI_API_KEY for AI drafts.`;
      if (callback) {
        await callback({
          text: `**Fallback draft:** ${content}

(Error: ${msg})`,
          action: executeDraftT3knoSocial
        });
      }
    }
    return false;
  }
};

// src/constants/icpLedgers.ts
var MAINNET_ICRC1_LEDGERS = [
  {
    id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    symbol: "ICP",
    name: "Internet Computer",
    decimals: 8,
    category: "native"
  },
  {
    id: "mxzaz-hqaaa-aaaar-qaada-cai",
    symbol: "ckBTC",
    name: "Chain-key Bitcoin",
    decimals: 8,
    category: "chain-key"
  },
  {
    id: "ss2fx-dyaaa-aaaar-qacoq-cai",
    symbol: "ckETH",
    name: "Chain-key Ethereum",
    decimals: 18,
    category: "chain-key"
  },
  {
    id: "xevnm-gaaaa-aaaar-qafnq-cai",
    symbol: "ckUSDC",
    name: "Chain-key USDC",
    decimals: 6,
    category: "chain-key"
  },
  {
    id: "5xnja-6aaaa-aaaan-qad4a-cai",
    symbol: "WICP",
    name: "Wrapped ICP (legacy swap liquidity)",
    decimals: 8,
    category: "dex-wrapper"
  },
  {
    id: "o7oak-iyaaa-aaaaq-aadzq-cai",
    symbol: "KONG",
    name: "KongSwap token",
    decimals: 8,
    category: "dex"
  }
];

// src/utils/ic/icrc1Balance.ts
import { Actor as Actor2, HttpAgent as HttpAgent2 } from "@dfinity/agent";
import { Principal as Principal2 } from "@dfinity/principal";
var DEFAULT_HOST = process.env.ICP_HOST || "https://icp0.io";
var idlFactory4 = ({ IDL }) => IDL.Service({
  icrc1_balance_of: IDL.Query(
    [
      IDL.Record({
        owner: IDL.Principal,
        subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
      })
    ],
    IDL.Nat
  ),
  icrc1_decimals: IDL.Query([], IDL.Nat8),
  icrc1_symbol: IDL.Query([], IDL.Text)
});
async function createIcrc1LedgerActor(canisterId, host = DEFAULT_HOST) {
  const agent = new HttpAgent2({ host, retryTimes: 2 });
  return Actor2.createActor(idlFactory4, {
    agent,
    canisterId
  });
}
async function icrc1BalanceOf(ledgerCanisterId, ownerPrincipalText, host) {
  const owner = Principal2.fromText(ownerPrincipalText.trim());
  const actor = await createIcrc1LedgerActor(ledgerCanisterId, host);
  return actor.icrc1_balance_of({
    owner,
    subaccount: []
  });
}

// src/utils/ic/fetchPortfolio.ts
function formatBalance(raw, decimals) {
  if (decimals <= 0) return raw.toString();
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}
async function fetchIcrc1Portfolio(ownerPrincipalText, ledgers = MAINNET_ICRC1_LEDGERS, host) {
  const rows = [];
  for (const L of ledgers) {
    try {
      const bal = await icrc1BalanceOf(L.id, ownerPrincipalText, host);
      rows.push({
        ledgerId: L.id,
        symbol: L.symbol,
        name: L.name,
        decimals: L.decimals,
        balanceRaw: bal.toString(),
        balanceFormatted: formatBalance(bal, L.decimals),
        category: L.category
      });
    } catch {
      rows.push({
        ledgerId: L.id,
        symbol: L.symbol,
        name: L.name,
        decimals: L.decimals,
        balanceRaw: "0",
        balanceFormatted: "\u2014",
        category: L.category
      });
    }
  }
  return rows;
}

// src/actions/queryIcrcPortfolio.ts
var ICP_HOST2 = process.env.ICP_HOST || "https://icp0.io";
function extractPrincipal(text) {
  var _a;
  const m = text.match(
    /\b([2-9a-z]{5,}-[2-9a-z-]+(?:-[2-9a-z-]+){2,})\b/i
  );
  return ((_a = m == null ? void 0 : m[1]) == null ? void 0 : _a.trim()) ?? null;
}
var executeQueryIcrcPortfolio = {
  name: "QUERY_ICRC_PORTFOLIO",
  similes: [
    "ICP_PORTFOLIO",
    "ICRC_BALANCES",
    "MY_ICP_TOKENS",
    "LIST_IC_TOKENS",
    "CKBTC_BALANCE",
    "CHECK_ICP_HOLDINGS"
  ],
  description: "Fetch ICRC-1 balances for a principal across known mainnet ledgers (ICP, ckBTC, ckETH, ckUSDC, WICP, KONG). Use when the user asks for ICP token holdings, portfolio on Internet Computer, or ck-token balances. Requires a textual Principal ID unless the agent wallet key is configured (then uses that principal).",
  validate: async (_runtime, message) => {
    var _a;
    const raw = ((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "";
    if (extractPrincipal(raw)) return true;
    const text = raw.toLowerCase();
    const ecosystem = [
      "icrc",
      "internet computer",
      "ckbtc",
      "cketh",
      "ckusdc",
      "wicp",
      "kong"
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
      "assets"
    ].some((k) => text.includes(k));
  },
  handler: async (runtime, message, _state, options) => {
    var _a;
    const callback = options == null ? void 0 : options.callback;
    const text = ((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "";
    let principal = extractPrincipal(text);
    if (!principal) {
      const prov = await icpWalletProvider.get(runtime, message, _state);
      if (prov.principal) principal = prov.principal;
    }
    if (!principal) {
      if (callback) {
        await callback({
          text: "Provide a textual **Principal** (e.g. `aaaaa-aa`) or configure `INTERNET_COMPUTER_PRIVATE_KEY` so I can use the agent\u2019s principal.",
          action: executeQueryIcrcPortfolio
        });
      }
      return true;
    }
    try {
      const rows = await fetchIcrc1Portfolio(principal, void 0, ICP_HOST2);
      const lines = rows.map(
        (r) => `- **${r.symbol}** (${r.name}): \`${r.balanceFormatted}\` \u2014 ledger \`${r.ledgerId}\` (${r.category})`
      );
      const reply = `**ICRC-1 portfolio** for \`${principal}\`:

${lines.join("\n")}

_Swaps: use official [ICPSwap](https://app.icpswap.com) or [KongSwap](https://kongswap.io); verify URLs before signing._`;
      if (callback) {
        await callback({ text: reply, action: executeQueryIcrcPortfolio });
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Could not load IC portfolio: ${msg}`,
          action: executeQueryIcrcPortfolio
        });
      }
      return true;
    }
  }
};

// src/constants/icpStandards.ts
var ICP_TOKEN_STANDARDS_SUMMARY = `
## Internet Computer token & NFT standards (summary)

### ICRC-1 \u2014 Fungible tokens (ledger)
- **icrc1_balance_of**, **icrc1_transfer**, **icrc1_metadata**, **icrc1_supported_standards**
- Subaccounts: 32-byte optional subaccount per principal.
- Most \u201CICP ecosystem tokens\u201D you trade are ICRC-1 ledgers.

### ICRC-2 \u2014 Approve / transfer_from
- **icrc2_allowance**, **icrc2_approve**, **icrc2_transfer_from**
- Used by DEX routers (e.g. swap paths that pull from your balance).
- **Security:** only approve spenders you trust; prefer limited amounts & time bounds when the ledger supports them.

### ICRC-3 \u2014 Transaction log & blocks (indexing)
- Block/transaction structure for indexers and explorers; often paired with ICRC-1 ledgers.

### Legacy NFT interfaces (still common)
- **DIP721** and **EXT** \u2014 collection-specific; balances are per canister, not one global \u201CNFT ledger\u201D.
- **Discovery:** use official collection canisters, marketplaces (e.g. Yumi, Entrepot history), or wallet UIs \u2014 there is no single chain-wide NFT enumeration API comparable to EVM indexers.

### ICRC-7 / ICRC-37 (NFT direction)
- Newer standards evolving for NFTs on ICP; adoption varies by collection.

### Practical guidance for agents
- **Read balances:** ICRC-1 **icrc1_balance_of** with (owner principal, subaccount) \u2014 anonymous query on public ledgers.
- **Swaps:** route users to audited frontends (**ICPSwap**, **KongSwap**); never ask for seed phrases; signing stays in Plug / II / OISY.
`.trim();

// src/actions/queryIcpStandards.ts
var executeQueryIcpStandards = {
  name: "QUERY_ICP_TOKEN_STANDARDS",
  similes: [
    "ICRC_1_EXPLAIN",
    "ICRC_2_EXPLAIN",
    "ICP_NFT_STANDARDS",
    "DIP721",
    "WHAT_IS_ICRC"
  ],
  description: "Summarize Internet Computer token standards (ICRC-1/2/3, legacy NFT interfaces, ICRC-7/37) and safe practices for agents. Use when the user asks how IC tokens, approvals, or NFTs work on ICP.",
  validate: async (_runtime, message) => {
    var _a;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    return text.includes("icrc") || text.includes("token standard") || text.includes("dip721") || text.includes("nft") && text.includes("icp") || text.includes("internet computer") && text.includes("token");
  },
  handler: async (_runtime, _message, _state, options) => {
    const callback = options == null ? void 0 : options.callback;
    if (callback) {
      await callback({
        text: ICP_TOKEN_STANDARDS_SUMMARY,
        action: executeQueryIcpStandards
      });
    }
    return true;
  }
};

// src/constants/icpDefi.ts
var ICPSWAP = {
  name: "ICPSwap",
  appUrl: "https://app.icpswap.com",
  docsUrl: "https://github.com/ICPSwap-Labs",
  /** Known WICP ledger (wrapped ICP) — verify before integrating transfers */
  wicpLedger: "5xnja-6aaaa-aaaan-qad4a-cai"
};
var KONGSWAP = {
  name: "KongSwap",
  appUrl: "https://kongswap.io",
  docsUrl: "https://kongswap.io/kb/documentation",
  /** From KongSwap knowledge base — verify on dashboard */
  mainDexCanister: "2ipq2-uqaaa-aaaar-qailq-cai",
  kongLedger: "o7oak-iyaaa-aaaaq-aadzq-cai"
};

// src/actions/queryIcpDefi.ts
var executeQueryIcpDefi = {
  name: "QUERY_ICP_DEFI_DEX",
  similes: [
    "ICPSWAP",
    "KONGSWAP",
    "ICP_SWAP",
    "ICP_DEX",
    "WHERE_TO_SWAP_ICP"
  ],
  description: "Point users to official ICPSwap and KongSwap web apps, docs, and reference ledger IDs (WICP, KONG). Emphasize URL verification and wallet-only signing. Use when the user asks where to swap tokens on ICP.",
  validate: async (_runtime, message) => {
    var _a;
    const text = (((_a = message == null ? void 0 : message.content) == null ? void 0 : _a.text) || "").toLowerCase();
    return text.includes("icpswap") || text.includes("kongswap") || text.includes("kong swap") || text.includes("swap") && text.includes("icp") || text.includes("dex") && text.includes("ic");
  },
  handler: async (_runtime, _message, _state, options) => {
    const callback = options == null ? void 0 : options.callback;
    const reply = `**DEX entry points (verify domain in your browser before signing)**

- **${ICPSWAP.name}** \u2014 ${ICPSWAP.appUrl} \xB7 docs: ${ICPSWAP.docsUrl} \xB7 WICP ledger reference: \`${ICPSWAP.wicpLedger}\`
- **${KONGSWAP.name}** \u2014 ${KONGSWAP.appUrl} \xB7 docs: ${KONGSWAP.docsUrl} \xB7 KONG ledger reference: \`${KONGSWAP.kongLedger}\` \xB7 main dex canister (verify on their UI): \`${KONGSWAP.mainDexCanister}\`

**Security:** Never share a seed phrase. Only approve token spenders you trust; prefer limited allowances. Phishing sites mimic DEX UIs \u2014 double-check the URL bar.`;
    if (callback) {
      await callback({ text: reply, action: executeQueryIcpDefi });
    }
    return true;
  }
};

// src/index.ts
var icpPlugin = {
  name: "icp",
  description: "Internet Computer Protocol Plugin for Eliza \u2014 wallet, canisters, Launchpad, T3kNo products, whole IC network",
  providers: [icpWalletProvider],
  actions: [
    executeCreateToken,
    executeQueryLaunchpad,
    executeQueryT3knoProducts,
    executeDraftT3knoSocial,
    executeQueryIcrcPortfolio,
    executeQueryIcpStandards,
    executeQueryIcpDefi
  ],
  evaluators: []
};
var index_default = icpPlugin;
export {
  index_default as default,
  icpPlugin
};
//# sourceMappingURL=index.js.map