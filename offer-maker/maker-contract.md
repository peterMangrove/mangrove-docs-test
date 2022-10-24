---
description: How to write offer execution logic
---

# Executing offers

### Offer Logic

The logic associated with an offer MUST be implemented through a `makerExecute` callback function. (See [data structures](../data-structures/offer-data-structures.md#mgvlib.singleorder) for `SingleOrder` type).

{% tabs %}
{% tab title="Signature" %}
```solidity
function makerExecute(MgvLib.SingleOrder calldata order)
external returns (bytes32 makerData);
```
{% endtab %}

{% tab title="Offer logic" %}
{% code title="MakerContract-0.sol" %}
```solidity
import {IERC20, IMaker, SingleOrder} "src/MgvLib.sol";

contract MyOffer is IMaker {
    address MGV; // address of Mangrove
    address reserve; // token reserve for inbound tokens
    
    // an example of offer execution that simply verifies that `this` contract has enough outbound tokens to satisfy the taker Order.
    function makerExecute(SingleOrder calldata order) 
    external returns (bytes32 makerData){
        // revert below (in case of insufficient funds) to signal mangrove we renege on trade
        // reverting as soon as early to minimize bounty
        require(
           IERC20(order.outbound_tkn).balanceOf(address(this)) >= order.wants),
           "MyOffer/NotEnoughFunds";
        );
        // do not perform any state changing call if caller is not Mangrove!
        require(msg.sender == MGV, "MyOffer/OnlyMangroveCanCallMe");
        // `order.gives` has been transfered by Mangrove to `this` balance
        // sending incoming tokens to reserve
        IERC20(order.inbound_tkn).transfer(reserve, order.gives);
        // this string will be passed to `makerPosthook`
        return "MyOffer/tradeSuccess";
    }
}
    
    
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Inputs

* `order` represents the [order](../offer-taker/taker-order.md#generalities) currently executing the offer and the current Mangrove configuration. `order.gives/order.wants` will match the price of the offer that is being executed up to a small precision. It contains the following fields:
  * `addresss outbound_tkn` the _outbound_ token.
  * `address inbound_tkn` the _inbound_ token.
  * `uint offerId` id of the offer being executed.
  * `MgvStructs.OfferPacked offer` (packed) [offer data](../data-structures/offer-data-structures.md#mgvlib.offer) as is was last posted by the offer logic.
  * `uint wants` amount (in _outbound_ tokens) to be made available to the taker
  * `uint gives` amount (in _inbound_ tokens) just received by the maker
  * `bytes32 offerDetail` packed details about the offer.
  * `bytes32 global` packed version of mangrove global config info.
  * `bytes32 local` packed version of mangrove config for the current [offer list](../technical-references/taking-and-making-offers/market.md).

{% hint style="success" %}
**Packed fields**

The fields `offer`, `offerDetail`, `global` and `local` contain packed information about the offer and Mangrove's config. In most cases you will not need those values; `wants` and `gives` should be enough. Otherwise, utility functions in [MgvLib](https://github.com/giry-dev/mangrove/blob/master/packages/mangrove-solidity/contracts/MgvLib.sol) will help you safely unpack the fields.
{% endhint %}

#### Outputs

* `makerData` If `makerData != bytes32("")` or if the call reverts, Mangrove will consider that execution has failed. `makerData` is always sent to `makerPosthook` later, so you can use it to transfer information to `makerPosthook` after a failure.

{% hint style="danger" %}
**Security concerns**

Your contract must ensure that unauthorized callers cannot run `makerExecute`. The simplest way is to have a constant `address mgv` and add `require(msg.sender == mgv,"unauthorized")` at the top of your `makerExecute`.
{% endhint %}

{% hint style="info" %}
**How to succeed**

To successfully execute the offer, the call should return `bytes32("")` and the offer's owner should have `wants` _outbound_ tokens available for Mangrove to transfer to the taker.

**How to fail**

To renege on an offer, you may revert, but a simpler method is to return any value other than `bytes32("")`. This way your logs will be preserved. Either way, `makerData` will be [sent back](maker-contract.md#offer-post-hook) by Mangrove to your `makerPosthook` function.

**Better fail early!**

The [bounty](offer-provision.md#computing-the-provision-and-offer-bounty) taken from the offer maker's provision is [proportional](offer-provision.md#computing-the-provision-and-offer-bounty) to the gas consumed by `makerExecute`. To minimize costs, try to fail as early as possible.

**Don't call Mangrove during `makerExecute`**

The offer list for the _outbound_ / _inbound_ token pair is temporarily locked during calls to `makerExecute`. Its offers cannot be modified in any way. We recommend that you use `makerPosthook` to repost/update your offers, since the offer list will unlocked by then.
{% endhint %}

### Offer post-hook

The logic associated with an offer may include a `makerPosthook` callback function. Its intended use is to update offers in the [offer list](../technical-references/taking-and-making-offers/market.md) containing the [offer](reactive-offer.md) that was just executed.

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

{% tab title="Offer logic" %}
{% code title="MakerContract-1.sol" %}
```solidity
import "./ERC20.sol";
import "./MgvLib.sol";
import "./MgvPack.sol";

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
                order.outbound_tkn, // same offer List
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

#### Inputs

* `order` same as in `makerExecute`.
* `result` A [struct](../data-structures/offer-data-structures.md#mgvlib-orderresult) containing:
  * the return value of `makerExecute`
  * additional data sent by Mangrove, more info [available here](../data-structures/offer-data-structures.md#mgvlib.orderresult).

#### Outputs

None.

{% hint style="danger" %}
**Security concerns**

Your contract must ensure that unauthorized callers cannot run `makerPosthook`. The simplest way is to have a constant `address mgv` and add `require(msg.sender == mgv,"unauthorized")` at the top of your `makerPosthook`.
{% endhint %}

{% hint style="info" %}
**Gas management**

Posthooks are given the executed offer's `gasreq` minus the gas used by `makerExecute`. Keep that in mind when posting a new offer and setting its `gasreq`.

**Updating offers during posthook**

During the execution of a posthook, the executed offer's list is unlocked. This feature can be used to repost an [offer](reactive-offer.md) (even the one that was just executed), possibly at a different price (see the **Offer logic** in the above code snippet).
{% endhint %}

{% hint style="success" %}
**Reverting in posthooks**

Reverting in a posthook never undoes the offer execution.
{% endhint %}
