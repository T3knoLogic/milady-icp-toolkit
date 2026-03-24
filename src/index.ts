import { icpWalletProvider } from "./providers/wallet";
import { executeCreateToken } from "./actions/createToken";
import { executeQueryLaunchpad } from "./actions/queryLaunchpad";
import { executeQueryT3knoProducts } from "./actions/queryT3knoProducts";
import { executeDraftT3knoSocial } from "./actions/draftT3knoSocial";

export const icpPlugin = {
    name: "icp",
    description: "Internet Computer Protocol Plugin for Eliza — wallet, canisters, Launchpad, T3kNo products, whole IC network",
    providers: [icpWalletProvider],
    actions: [
        executeCreateToken,
        executeQueryLaunchpad,
        executeQueryT3knoProducts,
        executeDraftT3knoSocial,
    ],
    evaluators: [],
};

export default icpPlugin;
