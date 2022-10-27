---
description: >-
  Introducing Mangrove's Offer Lists a low level representation of (half) an
  order book.
---

# Offer Lists

## General structure

{% hint style="info" %}
The offer list is the basic Mangrove data structure. It contains offers (created by offer makers) that promise an **outbound token**, and request an **inbound token** in return (offer takers execute these offers by providing the **inbound token**, and receive **outbound tokens** in return).

For example in a DAI-wETH offer list, DAI is the outbound token (i.e. sent or given by the offer) and wETH the inbound token (i.e. received or wanted by the offer).

Relationship to markets: a full market will always feature two offer lists. For instance, a wETH/DAI **market** has one DAI-wETH offer list (where wETH is requested and DAI is offered), and a wETH-DAI offer list (where DAI is requested and wETH is offered).\
\
[Mangrove's API ](../../explanations/around-the-mangrove/mangrove-api.md)offers Market abstractions that allows liquidity providers and takers to interact with Mangrove using standard **base &** **quote** denominations.
{% endhint %}

Here's a sample DAI-wETH offer list with two offers. Only the main characteristics of the offers are shown (see the [offer data structure](reactive-offer/offer-data-structures.md#mgvlib-offer)).

{% hint style="warning" %}
**Decimals**

We display human-readable values in the examples, but Mangrove stores raw token values and never uses the `decimals` field of a token.
{% endhint %}

| Rank | Offer ID | Wants (wETH) | Gives (DAI) | Gas required | Maker Contract | Offer Gas Price |
| ---- | -------- | ------------ | ----------- | ------------ | -------------- | --------------- |
| #1   | 77       | 1            | 2 925.26    | 250,000      | 0x5678def      | 150             |
| #2   | 42       | 0.3          | 871.764     | 300,000      | 0x1234abc      | 200             |

## Some terminology

### Offer rank

Offers are ordered from best to worst. Offers are compared based on _price_, and then on _gas required_ (see below) if they have the same price.

{% hint style="info" %}
**Example**

The price of offer #42 is 0.0003441298 wETH per DAI while the price of offer #77 is 0.00034185 wETH per DAI. Offer #77 is therefore the best offer (lowest price) of this offer list, and is ranked first.
{% endhint %}

### Offer ID

The identifier of the offer in the offer list.

{% hint style="danger" %}
**Important**

Two offers may have the same ID as long as they belong to different offer lists. For instance, there may be an offer #42 on the wETH-DAI offer list with different volumes, gas required, maker contract, etc. than offer #42 in the DAI-wETH offer list shown above.
{% endhint %}

### Wants, gives and entailed price

Taken together, the **wants** and **gives** values define 1) a max volume, 2) a price. The **entailed price** is p=**wants**/**gives**, and an offer promises delivery of up to **gives** outbound tokens at a price of p tokens delivered per inbound token received.

{% hint style="info" %}
**Examples**

* Offer #42 _wants_ 0.3 wETH to deliver its promised 871.764 DAI.
* If offer #77 is executed and receives 0.5 wETH, it must send back 1462.63 DAI.
{% endhint %}

### Gas required

The maximum amount of gas the [Maker Contract](reactive-offer/maker-contract.md) managing the offer will be allowed to spend if called by the Mangrove.

{% hint style="info" %}
**Example**

Offer #77 may consume up to 250K gas units.
{% endhint %}

### Maker Contract

The address of the [offer logic](reactive-offer/maker-contract.md#offer-logic) managing the offer. The `makerExecute` function of this contract will be called when one of its offers is executed.

### Gas Price

Gas price that was used to compute the [offer provision](reactive-offer/offer-provision.md). If the offer fails to deliver the promised **outbound tokens**, it will be charged in ETH based on this gasprice.

## Offer list configuration

Several [configuration](../governance-parameters/mangrove-configuration.md) parameters determine how new offers are inserted. Some are [global](../governance-parameters/mangrove-configuration.md#mgvlib.global) to Mangrove, some are [offer list specifics.](../governance-parameters/mangrove-configuration.md#mgvlib.local) See [Governance](../governance-parameters/) section for details.
