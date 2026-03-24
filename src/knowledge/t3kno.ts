/**
 * T3kNo-Logic product knowledge — single source for plugin-icp actions.
 * Mirrors t3kno-pr-agents knowledge.ts; used when Milady assists with products.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const _dir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(_dir, "..", "..");
const repoRoot = resolve(pluginRoot, "..");

const KNOWN_PATHS = [
    resolve(process.cwd(), "knowledge", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
    resolve(process.cwd(), "../knowledge", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
    resolve(process.cwd(), "../../T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
    resolve(repoRoot, "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
    resolve(pluginRoot, "..", "T3KNO_LOGIC_PRODUCTS_AND_LINKS.md"),
];

export function loadT3knoKnowledge(): string {
    for (const p of KNOWN_PATHS) {
        if (existsSync(p)) {
            return readFileSync(p, "utf-8");
        }
    }
    return FALLBACK_KNOWLEDGE;
}

const FALLBACK_KNOWLEDGE = `
# T3kNo-Logic Products (fallback)

- **NFT Matrix**: $99, 28+ chains, 1–10k NFTs, local desktop app. https://thenftmatrix.gumroad.com/l/fruzgy
- **Machina**: $29, VST3 synth/sequencer. https://thenftmatrix.gumroad.com/l/mzkks
- **Bonsai-Radio.xyz Widget**: Free, OBS-ready streaming player. https://thenftmatrix.gumroad.com/l/hrebyq
- **Bazaar** (t3kno-logic.xyz): Merch store, RWA airdrop, Bonsai Collective. https://t3kno-logic.xyz

**Critical:** NFT Matrix = NFT generator app. Bonsai Widget = streaming player. Different products.
`;

export function validateProductMentions(text: string): { valid: boolean; confusions: string[] } {
    const confusions: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes("nft matrix") && lower.includes("streaming")) {
        confusions.push("NFT Matrix is the NFT generator app, NOT the streaming widget.");
    }
    if (lower.includes("bonsai widget") && lower.includes("nft generator")) {
        confusions.push("Bonsai Widget is the streaming player, NOT the NFT generator.");
    }

    return { valid: confusions.length === 0, confusions };
}

export const T3KNO_PRODUCTS = ["NFT Matrix", "Machina", "Bonsai Widget", "Bazaar", "Bonsai-Radio.xyz", "t3kno-logic"] as const;
