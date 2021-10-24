---
description: Getting paid to clean Mangrove Offer Lists.
---

# Cleaning an offer

Offers on Mangrove may fail. This may be done [on purpose](../offer-making-strategies/taker-compensation.md) or the result of unexpected conditions. Either way, the caller is remunerated for their action by receiving a portion of the [bounty](../offer-maker/offer-bounty.md) attached to the failing offer.

# Cleaning bots

Mangrove has been designed such that keeping offer lists clean of failing offers is incentive-compatible. Anyone can run a bot which repeatedly does the following:

1. Receive events from Mangrove to maintain an up-to-date view of the books.
2. Locally runs offers at regular intervals.
3. Detects failing offers and sends a transaction to make the offer fail on-chain, with a gas price set such that the offer's bounty compensates for the spent gas.

Mangrove provides a [cleaner contract](https://github.com/giry-dev/mangrove/blob/master/packages/mangrove-solidity/contracts/periphery/MgvCleaner.sol) to help you. It provides the same interface as [snipes](./taker-order.md#offer-sniping) but will revert if any offer in the `targets` array successfully executes.



{% hint style="info" %}
**Example scenario**

Your bot has 900 DAI tokens, has given Mangrove an allowance to spend its DAI, and has given the cleaner contract an [allowance](./delegate-takers.md) to use its DAI on Mangrove. You detect that offer #708, which `wants` 800DAI and `gives` 800 USDC on the USDT-DAI **OL**, fails on your local fork of mainnet, so you call the cleaner contract with `targets` [set to](./taker-order.md#offer-sniping) `[[708,type(uint96).max,0,type(uint).max]]`, and `fillWants` set to `false`. Mangrove will use your DAI to execute offer #708 and revert after noticing that the offer fails. It will then transfer the offer bounty to you.

If the offer does not fail, the cleaner contract will revert.
{% endhint %}

## Delegation 
Cleaning can also use Mangrove's [delegation mechanism](./delegate-takers.md), which means you only need Mangrove to have an allowance on any address that that has enough **inbound tokens** of the **OL** you are targeting. The cleaner contract will use those funds to execute the cleaning.

{% hint style="info" %}
**Example scenario**

The address `funder.eth` has 900 DAI tokens and given Mangrove an allowance to spend its DAI. Offer #708 is still failing. You call the cleaner contract with the same `targets` as above, and `taker` set to `funder.eth`. Mangrove will use `funder.eth`'s DAI to execute offer #708 and revert after noticing that the offer fails. It will then transfer the offer bounty to you.

If the offer succeeds, Mangrove will notice that you had no allowance to use `funder.eth`'s DAI on Mangrove and revert (if you did have a high enough allowance, and the sniping succeeds, the cleaner contract will revert anyway).
{% endhint %}
