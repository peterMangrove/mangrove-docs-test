# Delegate Takers

## Approve or Permit&#x20;

A **Taker** **Order** on Mangrove can be sent on behalf of an Offer Taker, in which case the Delegate Taker needs to be approved or permitted to draw the required inbound tokens from the Offer Taker.&#x20;

{% hint style="info" %}
Approving a Delegate Taker for inbound tokens MUST be done via the standard `approve` function of the ERC20 managing the inbound token of the Offer List. The approval MUST be enough to cover `takerGives` amount of inbound tokens of the `snipesFor` or `marketOrderFor` calls.
{% endhint %}

Alternatively, Mangrove allows Offer Taker to `permit` a Delegate Taker to act on her behalf.

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

{% tab title="Second Tab" %}

{% endtab %}
{% endtabs %}

* `(outbound_tkn, inbound_tkn)` the outbound and inbound token of the Offer List on which the Delegate Taker will be permitted to operate.
* `owner` the address of the Offer Taker providing the inbound tokens for the Delegate Taker.
* `spender` the address of the Delegate Taker.
* `value` the maximal amount of inbound tokens the Delegate Taker is permitted to use.
* `deadline` the block number beyond which the delegator's signature can no longer be used to obtain permission.
* `(v,r,s)` the `secp256k1` [signature](https://eips.ethereum.org/EIPS/eip-2612) identifying the `owner` of the delegated funds.

## Delegated Order Taking&#x20;

Once a Delegate Taker is approved or permitted by an Offer Taker, she can use the delegated Taker Orders variants `marketOrderFor` and `snipesFor` which work similarly to `marketOrder` and `snipes` but require an additional `taker` address.

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

{% tab title="Second Tab" %}

{% endtab %}
{% endtabs %}
