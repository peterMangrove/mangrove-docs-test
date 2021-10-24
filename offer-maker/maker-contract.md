---
description: Developer documentation pertaining to writing and managing Maker contracts.
---

# Maker contract

## Description

{% hint style="info" %}
A **Maker Contract** is a smart contract whose address is associated with a [Reactive Offer ](reactive-offer.md)listed on a Mangrove _(Outbound, Inbound)_ [Offer List](../data-structures/market.md#offer-lists). Such contract are expected to comply with the [IMaker interface](https://github.com/giry-dev/mangrove/blob/c4446bbcb0a4dbade4777075eb3e26faebd1c218/contracts/MgvLib.sol#L161). A **Maker Contract** may be associated with several [Reactive Offers](reactive-offer.md) on Mangrove but deals with the realization of them through _the same_ callback function.
{% endhint %}

The aim of a **Maker Contract** being called by Mangrove for a specific [Offer](reactive-offer.md) is to make a certain amount of_ outbound_ tokens available to the Mangrove by the end of the execution of the `makerExecute` function of the contract. This function is called by Mangrove each time an offer managed by the Maker Contract is matched by a [taker order](../offer-taker/taker-order.md).&#x20;

{% hint style="info" %}
Suppose that a [Reactive Offer](reactive-offer.md) managed by the Maker Contract `gives` 100 outbound tokens and, in exchange, `wants` 20 inbound tokens. In addition, the offer requires a `gasreq` of 500,000  gas units to execute.

In order to make the 100 outbound tokens available to Mangrove,  the **Maker Contract** can rely on a [flashswap](https://uniswap.org/blog/uniswap-v2/#flash-swaps) of `wants` inbound tokens and 500,000 gas units, which it may use to source its liquidity (see [Maker Strategies](./)). If at the end of the `makerExecute` call Mangrove is unable to pull 100 outbound tokens from the **Maker Contract**, the trade is reverted (resulting in the inbound tokens being returned to the taker) and an [Offer Bounty](offer-bounty.md) is withdrawn from the **Maker Contract** provision on Mangrove.
{% endhint %}

## Offer execution

A **Maker Contract** MUST have a `makerExecute` callback functions of the following type:

{% tabs %}
{% tab title="Function" %}
```solidity
function makerExecute(MgvLib.SingleOrder calldata order)
external returns (bytes32 makerData);
```
{% endtab %}

{% tab title="In Maker Contract" %}
{% code title="MakerContract-0.sol" %}
```solidity
import "path_to_interfaces/ERC20.sol";
import "path_to_mangrove/MgvLib.sol";

contract MakerContract is IMaker {
    address MGV; // address of the Mangrove contract

    // an example of offer execution that simply verifies that `this` contracgt has enough outbound tokens to satisfy the taker Order.
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

* `order: MgvLib.SingleOrder calldata` is a [data structure](https://github.com/giry-dev/mangrove/blob/c4446bbcb0a4dbade4777075eb3e26faebd1c218/contracts/MgvLib.sol#L55) that transmits the [Taker Order](../offer-taker/taker-order.md) to the Maker Contract and recalls the [Offer](reactive-offer.md) as it was posted on the Mangrove.&#x20;
* `makerData:bytes32` is the decision of the Offer Maker with respect the continuation of the trade. Any non empty return value (i.e different from `bytes32("")`) is interpreted by Mangrove as an instruction to renege on trade. As a consequence the offer will be removed from its [Offer List](../data-structures/market.md) and a [bounty](offer-bounty.md#offer-bounty-computation) will be sent to the Offer Taker for compensation.&#x20;

{% hint style="info" %}
#### Return value

The `makerExecute` function SHOULD not revert in order to be able to log messages for introspection and monitoring by the offer maker. The intended clean way to renege on trade is rather to return a non empty `bytes32` word. This return value will be later on passed to the [`makerPosthook`](maker-contract.md#offer-post-hook) callback function under the `result.makerData `argument.&#x20;

#### Better fail early!

The [Offer Bounty](offer-bounty.md) that is taken from the Offer Maker's provision is [proportional ](offer-bounty.md#offer-bounty-computation)to the gas consumed by `makerExecute`. It is therefore wise to renege on trade early in the execution of `makerExecute` in order to minimize costs related to offer management.
{% endhint %}

{% hint style="danger" %}
**Important points**

* [x] **Maker Contract** MUST verify that the caller (`msg.sender`) of `makerExecute` is the Mangrove otherwise the price of the `order` can be arbitrary.
*   [x] By the end of the execution of this function, when the Offer Maker** **wishes to proceed with the outbound token transfer required by the order, the **Maker Contract**:

    * MUST have at least `order.wants` amount of outbound tokens in its balance.
    * MUST _not_ have reverted.
    * MUST have approved the outbound token ERC20 contract for Mangrove's transfer of `order.wants` tokens
    * MUST return the empty `bytes32` word (i.e`bytes32("")`) when it wishes to tell Mangrove contract to proceed with the transfer of the outbound tokens.

    Failure to comply with the above points will result in Mangrove transferring an ether [Bounty](offer-bounty.md) to the taker.
* [x] During the execution of `makerExecute`, the [Offer List](../data-structures/market.md) containing the offer being executed is guarded against _write_ reentrancy. **Maker Contract **MUST therefore not attempt to modify or post any offer on this[ Offer List](../data-structures/market.md) during the execution of `makerExecute` and use [`makerPosthook`](maker-contract.md#offer-post-hook) to do so if needed.
{% endhint %}

{% hint style="warning" %}
At the end of `makerExecute` the consumed offer is retracted from its [Offer List](../data-structures/market.md), even in the case of a partial fill. Should one want to repost the offer, one SHOULD use the `makerPosthook` to do so (see below).
{% endhint %}

## Offer post-hook&#x20;

A **Maker Contract** SHOULD have a `makerPosthook` callback function whenever it requires write access to the [Offer List](../data-structures/market.md) containing the [offer](reactive-offer.md#description) that was executed.

{% tabs %}
{% tab title="Function" %}
```solidity
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

* `order: MgvLib.SingleOrder calldata` A [struct](../data-structures/offer-data-structures.md#mgvlib-singleorder) containing the data of the Taker Order and a recap of the [Offer](../data-structures/offer-data-structures.md#mgvlib-offer) data as initially posted by the Maker Contract.
* `result: MgvLib.OrderResult calldata` A [struct](../data-structures/offer-data-structures.md#mgvlib-orderresult) gathering data generated during the execution of the offer.

{% hint style="danger" %}
**Important points**

* [x] **Maker Contract** MUST verify that the caller of `makerPosthook` is Mangrove (msg.sender).
* [x] An **offer post-hook**  is called by Mangrove with the remainder of the gas allocated to the offer after its execution. Hence, the `gasreq` parameter SHOULD cover both the execution of the offer and its post-hook (cf. [posting a new offer](reactive-offer.md#write-functions)).
* [x] Reverting in an offer post-hook (e.g for being out of gas) does not revert the offer execution.
{% endhint %}



{% hint style="info" %}
#### Persistent offers

When called back on `makerPosthook`, the **Maker Contract** has full reentrancy power into Mangrove. It particular it has write access to all [Offer Lists](../data-structures/market.md). This feature can be used to repost an [offer](reactive-offer.md), possibly at a different price (see In **Maker Contract tab** in the above code snippet).
{% endhint %}



