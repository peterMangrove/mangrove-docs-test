---
description: The most simple liquidity providing strategy, no offer logic, just a Wallet.
---

# On-the-fly offer

{% hint style="info" %}
An **On-the-fly Offer** (OTF) can be listed on Mangrove but is not equipped with any on-chain [logic](../explanations/offer-maker/#executing-offers) that executes when the offer is taken. Whenever it is matched by a [taker order](../explanations/offer-taker.md#taking-offers), the offer sources its liquidity on an Externally Owned Account (EOA).
{% endhint %}

{% hint style="warning" %}
An on-the-fly offer is not reactive (it has no code) and therefore cannot repost its residual if any. E.g an OTF offer of 1500 DAIs (outbound) for 1 wETH (inbound) that is matched by a taker order of 750 DAIs for 0.5 wETH will be removed from the book after it has been partially filled.
{% endhint %}

## How to post one?

You need to tell Mangrove you wish to post a new offer, signing this transaction with the wallet that contains the promised liquidity. Here is an example using [Mangrove's JS API](https://github.com/mangrovedao/mangrove/tree/master/packages/mangrove.js).

{% code title="directOffer.js" %}
```javascript
// this script assumes NODE_URL points to your access point and PRIVATE_KEY contains private key from which one wishes to post offers
const { Mangrove, ethers } = require("@mangrovedao/mangrove.js");
let provider = new ethers.providers.WebSocketProvider(
  NODE_URL
);
let wallet = new ethers.Wallet(PRIVATE_KEY, provider);

//connecting the API to Mangrove
let mgv = await Mangrove.connect({ signer: wallet });

//connecting mgv to a market
let market = await mgv.market({ base: "DAI", quote: "USDC" });

// check its live, should display the best Bids and Asks of the DAI,USDC market
market.consoleAsks();
market.consoleBids();

// create a simple LP on `market`, using `wallet` as a source of liquidity
let directLP = await mgv.liquidityProvider(market);

// Ask on market (promise base (DAI) in exchange of quote (USDC))
// LP needs to approve Mangrove for base transfer
let tx = await directLP.approveMangroveForBase();
await tx.wait();

// // querying mangrove to know the bounty for posting a new Ask on `market`
let prov = await directLP.computeAskProvision();

// //Posting a new Ask (offering 105 DAI for 104 USDC)
const { id: ofrId } = await directLP.newAsk({ wants: 105, gives: 104, fund:prov });
```
{% endcode %}

