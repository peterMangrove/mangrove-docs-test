---
description: Developer documentation pertaining to writing and managing Maker contracts.
---

# Offer execution

## Description

A **Maker Contract** is a smart contract whose address is associated with one or many [Reactive Offers](reactive-offer.md) listed on Mangrove [**Offer List**](broken-reference).
Maker Contracts should implement the [IMaker interface](https://github.com/giry-dev/mangrove/blob/c4446bbcb0a4dbade4777075eb3e26faebd1c218/contracts/MgvLib.sol#L161). They must at least implement the `makerExecute` function, otherwise they will fail all their offer executions.

Here is the offer lifecycle, with the parts addressed in this section bolded:

1. A contract at address `maker.eth` creates an offer.
2. Mangrove stores the offer info, including the address `maker.eth`.
3. An address `user.eth` executes that offer.
4. Mangrove transfers tokens from `user.eth` to `maker.eth`.
5. **Mangrove calls the function [`makerExecute`](#offer-execution) of `maker.eth`**.
6. Mangrove transfers tokens from `maker.eth` to `user.eth`.
7. **Mangrove calls the function [`makerPosthook`](#offer-post-hook) of `maker.eth`**.
8. The offer is now out of its Offer List, but may be updated at a later time by `maker.eth`.


{% hint style="info" %}
**Multiple offers per address**

A Maker Contract can post more than one offer. When it gets called through `makerExecute`, it will receive the id of the offer being executed as well as additional information.
{% endhint %}

{% hint style="info" %}
**Example scenario**
Suppose that an [offer](reactive-offer.md) managed by the Maker Contract promises 100,000 DAI in exchange for 100,000 USDC.

Upon being called, **Maker Contract** has 100,000 USDC available and may source DAI from anywhere on the chain. It needs to end execution with 100,000 available and ready to be transferred by Mangrove through `transferFrom`.
{% endhint %}

## Offer execution

A **Maker Contract** MUST have a `makerExecute` callback functions of the following type:

{% tabs %}
{% tab title="Signature" %}
```solidity

struct SingleOrder {
    address outbound_tkn;
    address inbound_tkn;
    uint offerId;
    bytes32 offer; // basic offer info
    uint wants; // Amount to be received by the taker
    uint gives; // Amount just received by the maker
    bytes32 offerDetail; // extra offer info
    bytes32 global; // packed version of mangrove global config info
    bytes32 local; // packed version of mangrove config for the current offer list
}

function makerExecute(MgvLib.SingleOrder calldata order)
external returns (bytes32 makerData);

```
{% endtab %}

{% tab title="In Maker Contract" %}
{% code title="MakerContract-0.sol" %}
```solidity
import "./ERC20.sol";
import "./MgvLib.sol";

contract MakerContract is IMaker {
    address MGV; // address of the Mangrove contract

    // an example of offer execution that simply verifies that `this` contract has enough outbound tokens to satisfy the taker Order.
    function makerExecute(MgvLib.SingleOrder calldata order) 
    external returns (bytes32 makerData){
        require(msg.sender == MGV, "Only mangrove can call me");
        ERC20 outTkn = ERC20(order.outbound_tkn); // the address of the ERC20 tokens the taker order wants
        if (outTkn.balanceOf(address(this)) >= order.wants) {
             makerData = "mgvOffer/failed";
         }
         // makerData = "" and Mangrove will proceed with the transfer
     }
}
    
    
```
{% endcode %}
{% endtab %}
{% endtabs %}

## Inputs

* `order` represents the [Taker Order](broken-reference) and the current Mangrove configuration. `order.gives/order.wants` will closely match the price of the offer that is being executed. It contains the following fields:
  * `addresss outbound_tkn` the **outbound token**. `wants` is denominated in `outbound_tkn`.
  *  `address inbound_tkn` the **inbound token**. `gives` is denominated in `inbound_tkn`.
  *  `uint offerId` id of the offer being executed.
  *  `uint offer` packed info about the offer. Use [MgvLib](TODO) to unpack.
  *  `uint wants` amount to be received by the taker
  *  `uint gives` amount just received by the maker
  *  `bytes32 offerDetail` packed details about the offer. Use [MgvLib](TODO) to unpack.
  *  `bytes32 global` packed version of mangrove global config info. Use [MgvLib](TODO) to unpack.
  *  `bytes32 local` packed version of mangrove config for the current offer list. Use [MgvLib](TODO) to unpack.

## Outputs
* `makerData` If `makerData != bytes32("")` or if the call reverts, Mangrove will consider that execution has failed. It is always sent `makerPosthook` later, so you can use it to transfer information to `makerPosthook` after a failure.

{% hint style="danger" %}
**Security concerns**

Your contract must ensure that unauthorized callers cannot run `makerExecute`. The simplest way is to have a constant `address mgv` and add `require(msg.sender == mgv,"unauthorized")` at the top of your `makerExecute`.
{% endhint %}


{% hint style="info" %}
**How to succeed**

To successfully execute the offer, the call should return `bytes32("")` and the offer's owner should have `wants` **outbound tokens** available for Mangrove to transfer to the taker.

**How to fail**

To renege on an offer, you may revert, but a simpler method is to return any value other than `bytes32("")`. This way your logs will be preserved. Either way, `makerData` will be [sent back](#offer-post-hook) by Mangrove to your `makerPosthook` function.

**Better fail early!**

The [bounty](offer-bounty.md) taken from the offer maker's provision is [proportional](offer-bounty.md#offer-bounty-computation) to the gas consumed by `makerExecute`. To minimize costs, try to fail as early as possible.

**Don't call Mangrove during `makerExecute`**

The offer list for the **outbound token**/**inbound token** pair is temporarily locked during calls to `makerExecute`. Its offers cannot be modified in any way. We recommend that you use `makerPosthook` to repost/update your offers, since the offer list will unlocked by then.
{% endhint %}

# Offer post-hook&#x20;

A **Maker Contract** may have a `makerPosthook` callback function. Its intended use is to update offers in the [Offer List](broken-reference) containing the [offer](reactive-offer.md#description) that was just executed.

{% tabs %}
{% tab title="Signature" %}
```solidity
struct OrderResult {
    bytes32 makerData; // data returned by `makerExecute`
    bytes32 mgvData; // additional data sent by Mangrove, see below
}

function makerPosthook(
    MgvLib.SingleOrder calldata order,
    MgvLib.OrderResult calldata result
  ) external;
```
{% endtab %}

{% tab title="In Maker Contract" %}
{% code title="MakerContract-1.sol" %}
```solidity
import "path_to_interfaces/ERC20.sol";
import "path_to_mangrove/MgvLib.sol";
import "path_to_mangrove/MgvPack.sol";

contract MakerContract is IMaker {
    // context 
    address MGV; // address of the Mangrove contract
    bytes32 immutable TRADE_SUCCESS = "offer/complete";
    bytes32 immutable TRADE_FAIL = "offer/failed";
    uint GASREQ; // gas required for offer execution

    ...
    function makerExecute(MgvLib.SingleOrder calldata order) external returns (bytes32){
    ...
    ...
    }
    
    // Example of post-hook
    // if taker order was a success, try to repost residual offer at the same price
    function makerPosthook(
        MgvLib.SingleOrder calldata order,
        MgvLib.OrderResult calldata result
    ) external {
        require (msg.sender == MGV, "posthook/invalid_caller");
        if (result.mgvData == "mgv/tradeSuccess") {
            // retrieving offer data
            MgvLib.SingleOffer memory offer = MgvPack.offer_unpack(order.offer);
            // the following call to updateOffer will revert if:
            // * `this` MakerContract doesn't have enough provision on Mangrove for the offer
            // * the residual/(GASREQ+offer_gasbase) is below Mangrove's minimal density
            // NB : a reverting posthook does not revert the offer execution
            Mangrove(MGV).updateOffer(
                order.outbound_tkn, // same Offer List
                order.inbound_tkn,
                offer.wants - order.gives, // what the offer wanted, minus what the taker order gave 
                offer.gives - order.wants, // what the offer was giving, minus what the taker took
                GASREQ, // keeping with the same gasreq
                0, // no good heuristic for the pivotId, so start with best offer
                order.offerId // reposting the offer that was consumed
            );
        }
    }
```
{% endcode %}
{% endtab %}
{% endtabs %}


## Inputs
* `order` same as in `makerExecute`.
* `result` A [struct](../data-structures/offer-data-structures.md#mgvlib-orderresult) containing:
  * the return value of `makerExecute`
  * additional data sent by Mangrove, more info [available here](../data-structures/offer-data-structures.md#mgvlib.orderresult).

## Outputs
None.

{% hint style="danger" %}
**Security concerns**

Your contract must ensure that unauthorized callers cannot run `makerPosthook`. The simplest way is to have a constant `address mgv` and add `require(msg.sender == mgv,"unauthorized")` at the top of your `makerPosthook`.
{% endhint %}


{% hint style="info" %}
**Gas management**

Posthooks are given the executed offer's `gasreq` minus the gas used by `makerExecute`. Keep that in mind when posting a new offer and setting its `gasreq`.

**Updating offers during posthook**

During the execution of a posthook, the executed offer's list is unlocked. This feature can be used to repost an [offer](reactive-offer.md) (even the one that was just executed), possibly at a different price (see the **Maker Contract tab** in the above code snippet).
{% endhint %}

{% hint style="success" %}
**Reverting in posthooks**

Reverting in a posthook never undoes the offer execution.
{% endhint %}


