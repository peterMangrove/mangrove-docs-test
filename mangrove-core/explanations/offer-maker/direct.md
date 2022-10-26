# Direct

Direct is an abstract implementation of [MangroveOffer](mangrove-offer.md), if you don't have a good understanding of MangroveOffer we recommend reading that page first.

Direct should be seen as an implementation that only works for one user, the admin of the contract. This means most calls are guarded, so only the admin can call them. Having only one user, simplifies the uses of the contract, since there is no need to keep track of who is posting offer, updating offers or retracting offers, it is always the admin.

Direct does many of the same things as MangroveOffer with a few key differences.

**How inbound tokens are handled (from the taker):** After the funds have been transferred from the taker to the Direct contract, it chooses to leave received funds on the contract's balance, until `makerPosthook` is called. The reason for leaving the funds on the contract is that multiple offers posted by this contract may be taken in the same market order. This will result in a cumulative amount of inbound tokens being on the contract's balance. Instead of transferring them during each call to `makerExecute`, it is cheaper in gas to wait until after all offers are taken, and then transfer all the funds left on the contract to the reserve.

**How outbound tokens are handled (for the taker):** When transferring the funds from the contract to the taker, Direct first tries to check if it itself has the funds, otherwise tries to get the funds from the reserve either by using a router or by using the contract itself. This means that if the contract already has the funds, no extra transfers are needed.

**Reserve:** When setting the reserve using a Direct contract, the Direct checks whether the caller is the admin of the contract and if so, the reserve is set. Since the contract can only be used by the admin, there is no need to check anything else. Setting the reserve to the Direct contracts address will save gas, since it saves the transfers between the Direct contract and the reserve.

MangroveOffer has no implementations of how to post a new offer, update an offer or retract an offer. Direct offers default implementations for this. Posting a new offer and updating an offer, is very simply done by forwarding the call to Mangroves own methods for post a new offer and updating an offer. Retracting a offer using Direct, will also forward the call to Mangroves own retract offer method. But since the Direct contract is the actual address that posts the offers on Mangrove, then if one chooses to deprovision the offer, all provisions will be return to the Direct contract. The Direct contract therefore implements an option to transfer the provision back to the admin of the contract.

![Flow of taking a offer made by Direct](../../../.gitbook/assets/Direct.png)
