from pyteal import *

def atomic_swap():
    # Global schema for storing swap offers
    global_schema = StateSchema(
        num_uints=4,  # For storing asset IDs and amounts
        num_byte_slices=2  # For storing addresses
    )

    # Local schema for user opt-in
    local_schema = StateSchema(
        num_uints=0,
        num_byte_slices=0
    )

    # Key constants
    ASSET1_ID_KEY = Bytes("asset1_id")
    ASSET1_AMOUNT_KEY = Bytes("asset1_amount")
    ASSET2_ID_KEY = Bytes("asset2_id")
    ASSET2_AMOUNT_KEY = Bytes("asset2_amount")
    CREATOR_KEY = Bytes("creator")
    TAKER_KEY = Bytes("taker")

    # Operations
    OP_CREATE = Bytes("create")
    OP_ACCEPT = Bytes("accept")
    OP_CANCEL = Bytes("cancel")

    # Common checks
    valid_number_of_transactions = Global.group_size() == Int(1)
    valid_fee = Txn.fee() <= Int(1000)
    
    # Create swap offer
    on_create = And(
        Txn.application_args[0] == OP_CREATE,
        Txn.application_args.length() == Int(5),
        App.globalPut(ASSET1_ID_KEY, Btoi(Txn.application_args[1])),
        App.globalPut(ASSET1_AMOUNT_KEY, Btoi(Txn.application_args[2])),
        App.globalPut(ASSET2_ID_KEY, Btoi(Txn.application_args[3])),
        App.globalPut(ASSET2_AMOUNT_KEY, Btoi(Txn.application_args[4])),
        App.globalPut(CREATOR_KEY, Txn.sender()),
        Int(1)
    )

    # Accept swap offer
    on_accept = And(
        Txn.application_args[0] == OP_ACCEPT,
        App.globalGet(CREATOR_KEY) != Txn.sender(),
        # Verify asset transfers in atomic group
        Global.group_size() == Int(2),
        # Additional checks for asset transfers would go here
        Int(1)
    )

    # Cancel swap offer
    on_cancel = And(
        Txn.application_args[0] == OP_CANCEL,
        App.globalGet(CREATOR_KEY) == Txn.sender(),
        Int(1)
    )

    # Handle each operation
    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(on_cancel)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == OP_CREATE, Return(on_create)],
        [Txn.application_args[0] == OP_ACCEPT, Return(on_accept)],
        [Txn.application_args[0] == OP_CANCEL, Return(on_cancel)]
    )

    return program

if __name__ == "__main__":
    with open("atomic_swap.teal", "w") as f:
        compiled = compileTeal(atomic_swap(), mode=Mode.Application, version=6)
        f.write(compiled) 