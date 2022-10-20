---
description: The most simple liquidity providing strategy, no offer logic, just a Wallet.
---

# On-the-fly offer

{% hint style="info" %}
An **On-the-fly Offer** is a [reactive Offer](../offer-maker/reactive-offer.md#posting-a-new-offer) listed on Mangrove that is not equipped with any on-chain [logic](../offer-maker/#executing-offers). Whenever it is matched by a [taker order](../offer-taker/#taking-offers), the offer sources its liquidity on an Externally Owned Account (EOA).
{% endhint %}

## How to post one?

You need to tell Mangrove you wish to post a new offer, signing this transaction with the wallet that contains the promised liquidity. Here is an example using [Mangrove's JS API](https://github.com/mangrovedao/mangrove/tree/master/packages/mangrove.js).

{% code title="directOffer.js" %}
```javascript
const { Mangrove } = require("@mangrovedao/mangrove.js");
const ethers = require("ethers");
let provider = new ethers.providers.WebSocketProvider(
  MUMBAI_NODE_URL
);
let wallet = new ethers.Wallet(MUMBAI_TESTER_PRIVATE_KEY, provider);

//connecting the API to Mangrove
let mgv = await Mangrove.connect({ signer: wallet });

//connecting mgv to a market
let market = await mgv.market({ base: "DAI", quote: "USDC" });

// check its live, should display the best Bids and Asks of the DAI,USDC market
market.consoleAsks();
market.consoleBids();

// create a simple LP on `market`
let directLP = await mgv.liquidityProvider(market);

// //Ask on market (promise base (DAI) in exchange of quote (USDC))
// //LP needs to approve Mangrove for base transfer
let tx = await directLP.approveMangroveForBase();
await tx.wait();

// // querying mangrove to know the bounty for posting a new Ask on `market`
let prov = await directLP.computeAskProvision();
tx = await directLP.fundMangrove(prov);
await tx.wait();

// //Posting a new Ask (offering 105 DAI for 104 USDC)
const { id: ofrId } = await directLP.newAsk({ wants: 105, gives: 104 });
```
{% endcode %}

