---
description: Using the API to post Maker orders on a Mangrove Market.
---

# Posting bids and asks

With a [`LiquidityProvider`](api-classes-overview.md#liquidityprovider) `mgvLP` on a [Market](api-classes-overview.md#market) instance, it is possible to post Bids and Asks with the following commands:

```javascript
// gives unlimited approval to Mangrove to transfer Base token from liquidity provider's logic/EOA
let tx = await mgvLP.approveMangroveForBase();
await tx.wait(); // waiting for tx confirmation

// querying mangrove to know the bounty for posting a new Ask on `market`
let prov = await mgvLP.computeAskProvision();
tx = await mgvLP.fundMangrove(prov);
await tx.wait();

// posting a new Ask on Mangrove
const {id:ofrId} = await mgvLP.newAsk({volume:1000, price:0.99});
const {id:ofrId_} = await mgvLP.newBid({volume:1000, price: 1.01});
```
