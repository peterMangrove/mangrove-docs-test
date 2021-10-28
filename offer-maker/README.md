---
description: A walkthrough guide to deploying a reactive offer on the Mangrove
---

# Making liquidity

An offer on Mangrove usually points to a contract containing the [offer logic](maker-contract.md) and specifies what it is ready to deliver and its price. Offer are stored in [offer lists](broken-reference/).

![](<../.gitbook/assets/basics (2).png>)

### [Creating & Updating offers](./#creating-and-updating-offers)

Any Ethereum account can offer liquidity on Mangrove. New offers are created through a `newOffer` function, and updated through `updateOffer`. The [Creating & Updating offers](reactive-offer.md) section details how to use those Mangrove functions.

### [Executing offers](./#executing-offers)

After an offer has been created or updated, it can be executed by anyone. Upon execution, the offer's logic has an opportunity to source the liquidity it has promised. The [Executing offers](maker-contract.md) section details how to structure your contract code in order to respond when its offers are executed.

### [Offer bounties](./#offer-bounties)

Since offers on Mangrove can fail, an ETH bounty is given to those who trigger failing offers, as compensation for the gas spent. This bounty is extracted from the offer's account deposit at Mangrove. The [Offer bounties](./#offer-bounties) section details how bounties work and how they are calculated.
