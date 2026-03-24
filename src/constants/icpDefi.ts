/**
 * Official-style entry points for DEX UIs. Always verify URLs in-browser (phishing risk).
 */
export const ICPSWAP = {
  name: "ICPSwap",
  appUrl: "https://app.icpswap.com",
  docsUrl: "https://github.com/ICPSwap-Labs",
  /** Known WICP ledger (wrapped ICP) — verify before integrating transfers */
  wicpLedger: "5xnja-6aaaa-aaaan-qad4a-cai",
} as const;

export const KONGSWAP = {
  name: "KongSwap",
  appUrl: "https://kongswap.io",
  docsUrl: "https://kongswap.io/kb/documentation",
  /** From KongSwap knowledge base — verify on dashboard */
  mainDexCanister: "2ipq2-uqaaa-aaaar-qailq-cai",
  kongLedger: "o7oak-iyaaa-aaaaq-aadzq-cai",
} as const;
