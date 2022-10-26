---
description: How to tap into the Mangrove's liquidity
---

# Taking available liquidity

![A market order consumes the offers starting from the best price, making sure that the limit price set by the taker is always satisfied.](../../.gitbook/assets/takerOrder1.png) ![A taker may snipe a custom set of offers, targeting those that have the lowest required gas for instance.](../../.gitbook/assets/takerOrder2.png)

### Taking offers

The main way to consume liquidity on Mangrove is through a market order, a configurable type of order that executes offers from best to worst. The [Taking offers](../technical-references/taking-and-making-offers/taker-order/) section details how market orders work, and covers [offer sniping](../technical-references/taking-and-making-offers/taker-order/#offer-sniping) as well, wherein one can target individual offers.

### Cleaning offers

Offers on Mangrove can fail. Liquidity-taking functions can also be used to trigger failing offers and take them out of Mangrove. The [Cleaning offers](../how-to-guides/cleaning-an-offer.md) section details how to safely trigger failing offers and make a profit doing so.

### Delegation

An allowance mechanism lets you separate the address that provides the funds and the address that originates the buy/sell transactions. The [Delegation](../technical-references/taking-and-making-offers/taker-order/delegate-takers.md) section details how to let other addresses use your funds.
