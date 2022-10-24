# Reneging on offers

Since Mangrove offers do not provision liquidity, there must be a mechanism that ensures that most of the time, the orderbook does not contain 'fake offers', that is, offers that renege on their promises.

Mangrove uses [Offer Provisions](../technical-references/taking-and-making-offers/reactive-offer/offer-provision.md) as a protection mechanism.

Consider an offer that promises 100WETH for 100DAI and requires 300k for execution. That gas will be paid for by the taker. If the 100WETH are delivered, all is well.

If they are not, the taker must be compensated for the wasted gas. This is why, when creating an offer, market makers must [provision](../technical-references/taking-and-making-offers/reactive-offer/offer-provision.md) for a potential [bounty](../technical-references/taking-and-making-offers/reactive-offer/offer-provision.md#computing-the-provision-and-offer-bounty) in ETH. That [bounty](../technical-references/taking-and-making-offers/reactive-offer/offer-provision.md#computing-the-provision-and-offer-bounty) depends on :

* The average gas price, as estimated by the Mangrove exchange itself. Let's name it `gasprice`.
* The amount of gas requested by the offer. Let's name it `gasreq`.
* A minimum gas expense determined by the Mangrove exchange. Let's name it `gas_overhead`.

To post their offer, the maker must lock `gasprice * (gasreq + gas_overhead)` WEI in the Mangrove.

* If the maker retracts their offer, the ETH will be available to the maker for withdrawal.
* If the offer is successfully executed, the ETH stays locked inside the offer.
* If the offer is executed and fails, part of the ETH goes to the taker and the rest is available to the maker for withdrawal.
  * The amount of ETH that goes to the taker depends on the gas _actually used during the execution of the offer_.

Now, a few observations about how the mechanism is implemented.

### Encouraging early renege

It is in the interest of a maker to code their contract such that, if they decide not to fill their promise, they do so as early as possible. This reduces the gas effectively spent and thus minimizes their operating costs.

### Bounties finance fast updates

During the lifecycle of a market order, makers of executed offers are called twice. Once to fulfill their promise, and once again to reinsert offers in the book. So even if an offer fails, the bounty mechanism lets the maker pay for reinserting their offer without delay. This reinsertion can use any onchain information available at the time, such as oracles.

### Don't update gasprice

A small tip: an implementation detail means that as a maker, you can save a write if you make sure that the gas price associated with your offer does not change between offer updates. The best way to do that is to radically overestimate the gasprice when calling `newOffer` and to then maintain that gasprice on every subsequent call to `updateOffer`.

### Overestimate gasprice

Internally, the Mangrove will overestimate the gasprice to give a margin of error. This increases the lockup size for makers, but protects takers and the Mangrove against a sudden gasprice increase which would leave any cleaning unprofitable.

### Keeper mechanism

Since the Mangrove internal gasprice is overestimated, the activity of 'book cleaning' is profitable. For instance, consider a failing offer which requires 10k gas at an estimated gasprice of 100 gwei. A specialized Keeper bot can come in and execute the offer (after a local dry-run to ensure the offer does fail). As long as they pay a gasprice below 100 gwei, they will come out of the transaction earning a net profit.
