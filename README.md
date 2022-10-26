---
description: The Mangrove is an on-chain, orderbook-based exchange where offers are code.
---

# Mangrove developer documentation

## Who is this documentation for?

* This documentation is targeted at readers who want to interact with the on-chain Mangrove core contracts. This can be done via the [Mangrove API](mangrove-js/) or your own way.
* For a higher-level intro to Mangrove, check out [mangrove.exchange](https://mangrove.exchange).
* If you want to modify and improve Mangrove, [read the annotated code](http://code.mangrove.exchange/MgvDoc.html) and head to the [Github repository](https://github.com/mangrovedao/mangrove).

![A bird eye view of the Mangrove ecosystem.](<.gitbook/assets/ContactMap (1).png>)

## Who interacts with Mangrove

There are 3 types of actors in play:

* Offer makers add [liquidity promises](mangrove-core-and-strat/offer-maker/) to Mangrove. They own offers in [offer lists](data-structures/market.md) and must manage contracts that react to [offer execution](data-structures/offer-data-structures.md).
* Takers go to Mangrove to [find liquidity](mangrove-core-and-strat/offer-taker/) by executing offers already in Mangrove.
* [Governance](meta-topics/governance.md) adjusts Mangrove parameters, opens new pairs, sets fees, etc.
