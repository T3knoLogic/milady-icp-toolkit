/**
 * Known ICRC-1 ledger canisters (mainnet). Decimals from token metadata where standard;
 * verify on-chain before financial use.
 */
export interface Icrc1LedgerMeta {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  /** Short note: icp-native, ck-token, dex-wrapper, sns, etc. */
  category: string;
}

export const MAINNET_ICRC1_LEDGERS: Icrc1LedgerMeta[] = [
  {
    id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    symbol: "ICP",
    name: "Internet Computer",
    decimals: 8,
    category: "native",
  },
  {
    id: "mxzaz-hqaaa-aaaar-qaada-cai",
    symbol: "ckBTC",
    name: "Chain-key Bitcoin",
    decimals: 8,
    category: "chain-key",
  },
  {
    id: "ss2fx-dyaaa-aaaar-qacoq-cai",
    symbol: "ckETH",
    name: "Chain-key Ethereum",
    decimals: 18,
    category: "chain-key",
  },
  {
    id: "xevnm-gaaaa-aaaar-qafnq-cai",
    symbol: "ckUSDC",
    name: "Chain-key USDC",
    decimals: 6,
    category: "chain-key",
  },
  {
    id: "5xnja-6aaaa-aaaan-qad4a-cai",
    symbol: "WICP",
    name: "Wrapped ICP (legacy swap liquidity)",
    decimals: 8,
    category: "dex-wrapper",
  },
  {
    id: "o7oak-iyaaa-aaaaq-aadzq-cai",
    symbol: "KONG",
    name: "KongSwap token",
    decimals: 8,
    category: "dex",
  },
];

export function ledgerBySymbol(sym: string): Icrc1LedgerMeta | undefined {
  const u = sym.toUpperCase();
  return MAINNET_ICRC1_LEDGERS.find(
    (l) => l.symbol.toUpperCase() === u || l.id === sym,
  );
}
