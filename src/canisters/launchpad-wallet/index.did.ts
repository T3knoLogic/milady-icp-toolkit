/** Candid IDL for ICP Launchpad Wallet */
export const idlFactory = ({ IDL }: { IDL: any }) => {
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
        whoami: IDL.Func([], [IDL.Principal], ["query"]),
    });
};
