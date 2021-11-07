---
description: Taking offers on behalf of another address
---

# Delegation

## Approve or Permit

A **Taker** **Order** on Mangrove can be sent on behalf of a taker, in which case the delegate taker needs to be approved or permitted to draw the required inbound tokens from the taker.

{% hint style="info" %}
Approving a Delegate Taker for inbound tokens MUST be done via the standard `approve` function of the ERC20 managing the inbound token of the offer list. The approval MUST be enough to cover `takerGives` amount of inbound tokens of the `snipesFor` or `marketOrderFor` calls.
{% endhint %}

Alternatively, Mangrove allows the taker to `permit` a delegate taker to act on their behalf.

{% tabs %}
{% tab title="Function" %}
```solidity
function permit(
    address outbound_tkn,
    address inbound_tkn,
    address owner,
    address spender,
    uint value,
    uint deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
```
{% endtab %}
{% endtabs %}

* `(outbound_tkn, inbound_tkn)` the outbound and inbound token of the offer list on which the Delegate Taker will be permitted to operate.
* `owner` the address of the taker providing the inbound tokens for the Delegate Taker.
* `spender` the address of the Delegate Taker.
* `value` the maximal amount of inbound tokens the Delegate Taker is permitted to use.
* `deadline` the block number beyond which the delegator's signature can no longer be used to obtain permission.
* `(v,r,s)` the `secp256k1` [signature](https://eips.ethereum.org/EIPS/eip-2612) identifying the `owner` of the delegated funds.

## Delegated Order Taking

Once a Delegate Taker is approved or permitted by a taker, she can use the delegated Taker Orders variants `marketOrderFor` and `snipesFor` which work similarly to `marketOrder` and `snipes` but require an additional `taker` address.

{% tabs %}
{% tab title="Functions" %}
```solidity
// Delegated Market Order
function marketOrderFor(
    address outbound_tkn,
    address inbound_tkn,
    uint takerWants,
    uint takerGives,
    bool fillWants,
    address taker
  ) external returns (uint takerGot, uint takerGave);
 
// Delegated snipes
function snipesFor(
    address outbound_tkn,
    address inbound_tkn,
    uint[4][] memory targets,
    bool fillWants,
    address taker
  )
    external
    returns (
      uint successes,
      uint takerGot,
      uint takerGave
    );
    
```
{% endtab %}
{% endtabs %}
