---
description: How to write offer execution logic
---

# Executing offers

### Offer Logic

The logic associated with an offer **must** be implemented through a `makerExecute` callback function. (See [data structures](offer-data-structures.md#mgvlib.singleorder) for `SingleOrder` type).

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

* `order` is a [data structure](../../governance-parameters/) containing a recap of the [taker order](offer-data-structures.md#mgvlib.singleorder) and Mangrove's current configuration state. The protocol guarantees that `order.gives/order.wants` will match the price of the offer that is being executed up to a small precision.&#x20;

#### Outputs

* `makerData` is an arbitrary `bytes32` that will be passed to `makerPosthoook` in the `makerData` field.

{% hint style="danger" %}
**Security concerns**

Your contract should ensure that only Mangrove can call `makerExecute` to avoid unwanted state change.&#x20;
{% endhint %}

{% hint style="success" %}
**How to succeed**

To successfully execute, the logic **must** not revert during the call to `makerExecute` and have at least `wants` _outbound_ tokens available for Mangrove to transfer by the end of the function's execution.

**How to renege on trade**

The proper way to renege on an offer is to make the execution of `makerExecute` throw with a reason that can be cast to a `bytes32`. Having a balance of _outbound_ tokens that is lower than `order.wants` will also make trade fail, but with a higher incurred gas cost and thus a higher [bounty](offer-provision.md#provision-and-offer-bounty).
{% endhint %}

{% hint style="warning" %}
**Better fail early!**

The [bounty](offer-provision.md#computing-the-provision-and-offer-bounty) taken from the offer maker's provision is [proportional](offer-provision.md#computing-the-provision-and-offer-bounty) to the gas consumed by `makerExecute`. To minimize costs, try to fail as early as possible.
{% endhint %}

{% hint style="danger" %}
**Mangrove is guarded against reentrancy during `makerExecute`**

The offer list for the _outbound_ / _inbound_ token pair is temporarily locked during calls to `makerExecute`. Its offers cannot be modified in any way. The offer logic must use `makerPosthook` to repost/update its offers, since the offer list will unlocked by then.
{% endhint %}

### Offer post-hook

The logic associated with an offer may include a `makerPosthook` callback function. Its intended use is to update offers in the [offer list](../market.md) containing the [offer](./) that was just executed.

{% tabs %}
{% tab title="Signature" %}
```solidity
function makerPosthook(
    MgvLib.SingleOrder calldata order,
    MgvLib.OrderResult calldata result
  ) external;
```
{% endtab %}

{% tab title="Offer logic" %}
{% code title="MakerContract-1.sol" %}
```solidity
import {IERC20, IMaker, SingleOrder, OrderResult, MgvStructs} from "src/MgvLib.sol";

abstract contract MakerContract is IMaker {
    // context 
    address MGV; // address of the Mangrove contract
    
    // Example of post-hook
    // if taker order was a success, try to repost residual offer at the same price
    function makerPosthook(
        SingleOrder calldata order,
        OrderResult calldata result
    ) external {
        require (msg.sender == MGV, "posthook/invalid_caller");
        if (result.mgvData == "mgv/tradeSuccess") {
            // retrieving offer data
            // the following call to updateOffer will revert if:
            // * `this` MakerContract doesn't have enough provision on Mangrove for the offer
            // * the residual/(GASREQ+offer_gasbase) is below Mangrove's minimal density
            // NB : a reverting posthook does not revert the offer execution
            Mangrove(MGV).updateOffer(
                order.outbound_tkn, // same offer List
                order.inbound_tkn,
                order.offer.wants() - order.gives, // what the offer wanted, minus what the taker order gave 
                order.offer.gives() - order.wants, // what the offer was giving, minus what the taker took
                order.offerDetail.gasreq(), // keeping with the same gasreq
                order.offer.next(), // using next offer as pivot
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
* `result` A [struct](offer-data-structures.md#mgvlib-orderresult) containing:
  * the return value of `makerExecute`
  * additional data sent by Mangrove, more info [available here](offer-data-structures.md#mgvlib.orderresult).

#### Outputs

None.

{% hint style="danger" %}
**Security concerns**

Your contract should ensure that only Mangrove can call `makerPosthook` to avoid unwanted state change.
{% endhint %}

{% hint style="warning" %}
**Gas management**

`MakerPosthook` is given the executed offer's `gasreq` minus the gas used by `makerExecute`.&#x20;

**Updating offers during posthook**

During the execution of a posthook, the executed offer's list is unlocked. This feature can be used to repost an [offer](./) (even the one that was just executed), possibly at a different price.
{% endhint %}

{% hint style="warning" %}
**Reverting**

Reverting during `makerPosthook` does not renege on trade, which is settled at the end of `makerExecute`.
{% endhint %}
