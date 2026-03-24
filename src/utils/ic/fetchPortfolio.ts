import type { Icrc1LedgerMeta } from "../../constants/icpLedgers";
import { MAINNET_ICRC1_LEDGERS } from "../../constants/icpLedgers";
import { icrc1BalanceOf } from "./icrc1Balance";

export interface PortfolioRow {
  ledgerId: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceRaw: string;
  /** Human-readable (no thousands sep) */
  balanceFormatted: string;
  category: string;
}

function formatBalance(raw: bigint, decimals: number): string {
  if (decimals <= 0) return raw.toString();
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export async function fetchIcrc1Portfolio(
  ownerPrincipalText: string,
  ledgers: Icrc1LedgerMeta[] = MAINNET_ICRC1_LEDGERS,
  host?: string,
): Promise<PortfolioRow[]> {
  const rows: PortfolioRow[] = [];
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
        category: L.category,
      });
    } catch {
      rows.push({
        ledgerId: L.id,
        symbol: L.symbol,
        name: L.name,
        decimals: L.decimals,
        balanceRaw: "0",
        balanceFormatted: "—",
        category: L.category,
      });
    }
  }
  return rows;
}
