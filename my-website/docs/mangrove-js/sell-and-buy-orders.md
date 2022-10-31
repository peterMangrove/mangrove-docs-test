---
description: Using the API to pass taker orders on a Mangrove market.
---

# Sell and buy orders



Buying with cash or selling for cash can be done via the `buy` and `sell` functions of a [Market](api-classes-overview.md#market) instance. The code snippets below send limit buy (taker) orders on the market, with an allowed slippage of 2%:&#x20;

```typescript
// buy limit order for 100 base tokens at an average price of 0.1 quote per base
const buyResult = mgvMarket.buy({volume:100, price:0.1, slippage:2});
// limit order with a desired quantitiy
const buyResult_ = mgvMarket.buy({wants:100, gives:1000, slippage:2});
// sell limit order (selling 10 base tokens).
const sellResult = mgvMarket.sell({volume:10, price: 0.09, slippage:2});
```

{% hint style="info" %}
`sell` and `buy` orders return a triple `{`takerGave:Big, takerGot:Big, penalty:Big`}` where:

* `takerGave` is the total amount of base (for a sell) or quote (for a buy) tokens that the taker spent for the order
* `takerGot` is the total amount of quote (for a sell) or base (for a buy) tokens that the taker received as a result of the order
* `penalty` is the amount of native tokens the taker received to compensate for the gas lost of executing failing offer during the order execution (see [offer bounty](https://docs.mangrove.exchange/basic-usage/offer-maker/offer-provision#computing-the-provision-and-offer-bounty)).
{% endhint %}
