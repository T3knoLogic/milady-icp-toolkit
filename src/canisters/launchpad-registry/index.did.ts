/** Candid IDL for ICP Launchpad Registry */
export const idlFactory = ({ IDL }: { IDL: any }) => {
    const CanisterInfo = IDL.Record({
        created_at: IDL.Int,
        id: IDL.Principal,
        name: IDL.Text,
        network: IDL.Text,
        owner: IDL.Principal,
    });
    const Result = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
    return IDL.Service({
        get: IDL.Func([IDL.Principal], [IDL.Opt(CanisterInfo)], ["query"]),
        list_all: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
        list_mine: IDL.Func([], [IDL.Vec(CanisterInfo)], ["query"]),
        register: IDL.Func([IDL.Principal, IDL.Text, IDL.Text], [Result], []),
        unregister: IDL.Func([IDL.Principal], [Result], []),
        update_name: IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    });
};
