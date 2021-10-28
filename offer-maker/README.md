---
description: A walkthrough guide to deploying a reactive offer on the Mangrove
---

# Sourcing liquidity

An offer on the Mangrove points to a piece of [solidity](https://solidity-fr.readthedocs.io/fr/latest/) code called a [Maker Contract](maker-contract.md). What this contract is able to deliver is specified as a [Reactive Offer](reactive-offer.md), which is listed in a Mangrove [Offer List](broken-reference).&#x20;

![](<../.gitbook/assets/basics (2).png>)

## Creating & Updating offers

Any Ethereum account can offer liquidity on Mangrove. New offers are created through a `newOffer` function, and updated through `updateOffer`. The [Creating & Updating offers](./reactive-offer.md) section details how to use those Mangrove functions.

## Executing offers

After an offer has been created or updated, it can be executed by anyone. Upon execution, the offer's logic has an opportunity to source the liquidity it has promised. The [Executing offers](./maker-contract.md) section details how to structure your contract code in order to respond when its offers are executed.

## Offer bounties

Since offers on Mangrove can fail, a bounty is given to those who trigger failing offers. This bounty is extracted by a provision deposited for the account that created the offer. The [Offer bounties] section details how bounties work and how they are calculated.


