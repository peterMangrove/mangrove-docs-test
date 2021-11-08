---
description: The Mangrove is an onchain, orderbook-based exchange where offers are code.
---

# Mangrove developer documentation

## Who this is for

* This documentation is targeted at readers who want to interact with the on-chain Mangrove core contracts.&#x20;
  * For a higher-level intro to Mangrove, check out [mangrove.exchange](https://mangrove.exchange).&#x20;
  * If you want to modify and improve Mangrove, [read the annotated code](https://giry-dev.github.io/mangrove/MgvDoc.html) and head to the [github repository](https://github.com/giry-dev/mangrove).

![A bird eye view of the Mangrove ecosystem.](<.gitbook/assets/ContactMap (1).png>)

## Who interacts with Mangrove

There are 3 types of actors in play:

* Offer makers add [liquidity promises](offer-maker/) to Mangrove. They own offers in [offer lists](data-structures/market.md) and must manage contracts that react to [offer execution](data-structures/offer-data-structures.md).
* Takers go to Mangrove to [find liquidity](offer-taker/) by executing offers already in Mangrove.
* [Governance](meta-topics/governance.md) adjusts Mangrove parameters, opens new pairs, sets fees, etc.
