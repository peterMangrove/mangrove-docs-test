---
description: The most simple liquidity providing strategy.
---

# Trivial offer

{% hint style="info" %}
A **Trivial Offer** is a [reactive Offer](../offer-maker/reactive-offer.md#posting-a-new-offer) listed on Mangrove that is not equipped with any on-chain [logic](../offer-maker/#executing-offers). Whenever it is matched by a [taker order](../offer-taker/#taking-offers), the offer sources its liquidity on an Externally Owned Account (EOA).
{% endhint %}

## How to deploy it?

Well, it's... trivial. You just need to tell Mangrove you wish to post a new offer, signing this transaction with the wallet that contains the promised liquidity. Here is an example using [Mangrove's JS API](https://github.com/mangrovedao/mangrove/tree/master/packages/mangrove.js).



## What advantage does it give you?
