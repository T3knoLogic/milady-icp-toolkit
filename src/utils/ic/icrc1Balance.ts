import { Actor, type ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { IDL } from "@dfinity/candid";

const DEFAULT_HOST = process.env.ICP_HOST || "https://icp0.io";

const idlFactory = ({ IDL }: { IDL: typeof import("@dfinity/candid").IDL }) =>
  IDL.Service({
    icrc1_balance_of: IDL.Query(
      [
        IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        }),
      ],
      IDL.Nat,
    ),
    icrc1_decimals: IDL.Query([], IDL.Nat8),
    icrc1_symbol: IDL.Query([], IDL.Text),
  });

export type Icrc1LedgerActor = ActorSubclass<{
  icrc1_balance_of: (a: {
    owner: Principal;
    subaccount: [] | [Uint8Array];
  }) => Promise<bigint>;
  icrc1_decimals: () => Promise<number>;
  icrc1_symbol: () => Promise<string>;
}>;

export async function createIcrc1LedgerActor(
  canisterId: string,
  host = DEFAULT_HOST,
): Promise<Icrc1LedgerActor> {
  const agent = new HttpAgent({ host, retryTimes: 2 });
  return Actor.createActor(idlFactory as unknown as IDL.InterfaceFactory, {
    agent,
    canisterId,
  }) as Icrc1LedgerActor;
}

export async function icrc1BalanceOf(
  ledgerCanisterId: string,
  ownerPrincipalText: string,
  host?: string,
): Promise<bigint> {
  const owner = Principal.fromText(ownerPrincipalText.trim());
  const actor = await createIcrc1LedgerActor(ledgerCanisterId, host);
  return actor.icrc1_balance_of({
    owner,
    subaccount: [],
  });
}
