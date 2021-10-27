---
description: The Mangrove is an onchain, orderbook-based exchange where offers are code.
---

# Mangrove developer documentation

## Who this is for

This documentation is targeted at readers who want to interact with the on-chain Mangrove core contracts. For a higher-level intro to Mangrove, go \[there]\(TODO). On the other hand if you want to modify and improve Mangrove, you should \[read the annotated code]\(TODO).

![Liquidity takers (left) and makers (right) interacting with the Mangrove](.gitbook/assets/contactMap.png)

## Who interacts with Mangrove

There are 3 types of actors in play:

* Offer makers [add _liquidity promises_ ](offer-taker/)to Mangrove. They own offers in [offer lists](broken-reference) and must manage contracts that react to [offer execution](data-structures/offer-data-structures.md).
* Takers go to Mangrove to [_find liquidity _](offer-maker/)by executing offers already in Mangrove.
* [Governance](meta-topics/governance.md#offer-list-specific-governance-parameters) adjusts Mangrove parameters, opens new pairs, sets fees, etc.

