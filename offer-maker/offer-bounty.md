---
description: >-
  An offer maker provisions a bounty to compensate takers for the gas used when
  her offer fails.
---

# Offer Bounty

## Offer bounty computation

The computation of the **bounty** $$\beta$$ that should be provisioned when posting a new [offer](reactive-offer.md) on a Mangrove [offer list](broken-reference/) depends various parameters (follow hyperlinks for more information about their respective meaning).

The price (in WEIs) of an **offer bounty** is meant to compensate takers for the gas used to execute the offer in case of failure. At the time an offer is posted, Mangrove's [gasprice](../meta-topics/governance.md#gas-price-and-oracle) $$\gamma_{\mathsf{mgv}}$$ is used to determine the bounty $$\beta$$​the following way:

* [Global](../meta-topics/governance.md#global-governance-parameters) parameters:
  * `global.gasprice `$$G$$`​`
* [Offer list specific](../meta-topics/governance.md#offer-list-specific-governance-parameters) parameters:
  * `local.overhead_gasbase `$$g_0$$`​`
  * `local.offer_gasbase` $$g_1$$
* Offer specific [data](../data-structures/offer-data-structures.md#mgvlib.offer) :
  * `offer.gasprice` $$G_{\mathsf{ofr}}$$
  * `offerDetail.gasreq` $$g_\mathsf{ofr}$$

Mangrove requires to provision (in WEI): $$\beta = \hbox{max}(G, G_\mathsf{ofr})*\left(g_0+g_1+g_\mathsf{ofr}\right)$$

where $$\gamma_\mathsf{req}$$is the gas required by the offer, $$K_0$$is the [gas overhead](../meta-topics/governance.md#global-governance-parameters) constant (the amount of gas necessary to call an offer) and $$K(O,I)$$​

{% hint style="warning" %}
**Applied bounty**

Suppose an offer requires $$g_{\mathsf{ofr}}$$​ gas units to execute. As explained above, Mangrove will require the offer's associated account to provision $$\beta$$ WEI. Suppose the offer is executed during a Taker Order and fails after $$g_{\mathsf{used}}$$gas units ($$g_\mathsf{used}<g_\mathsf{ofr}$$). The portion of the bounty that will be transferred to the Offer Taker's account is $$\dot G*(\dot g_0+\dot g_1+g_\mathsf{used})$$ where $$\dot G$$​, $$\dot g_0$$ and $$\dot g_1$$are respectively the [`global.gasprice`](../meta-topics/governance.md#global-parameters), [`local.overhead_gasbase`](../meta-topics/governance.md#offer-list-specific-governance-parameters) and the [`local.offer_gasbase`](../meta-topics/governance.md#offer-list-specific-governance-parameters) values \_at the time the offer is taken \_(which may differ from their values at the time the offer was posted, as a consequence of some parameter changes by the governance).
{% endhint %}

{% hint style="info" %}
An offer bounty is calculated so that, within reasonable gas estimates, taking a failing offer should be profitable for the taker. In practice it is guaranteed to be the case if taking the offer is done at a `tx.gasprice` that is lower than the`gasprice` global [governance parameter](../meta-topics/governance.md#gas-price-and-oracle) $$G$$ in the above equation.
{% endhint %}

{% hint style="info" %}
Posting an offer with a $$G_\mathsf{ofr}>G$$ is a way for the Offer Maker to anticipate future gas price update of the Governance and minimize gas cost of offer reposting.
{% endhint %}

A view function of the [Mangrove Reader](../meta-topics/mangroves-ecosystem/reader.md) contract allows one to obtain easily the necessary bounty to provision, given an offer gas requirement and an offer gas price.

{% tabs %}
{% tab title="Function" %}
```solidity
function getProvision(
    address outbound_tkn,
    address inbound_tkn,
    uint ofr_gasreq,
    uint ofr_gasprice
) external view returns (uint bounty);
```
{% endtab %}

{% tab title="Solidity snippet" %}
{% code title="getProvision.sol" %}
```solidity
import "./MgvReader.sol";
//context 
MgvReader mgvr; // MgvReader contract address
address outTk; // outbound token address
address inbTk; // inbound token address

// computing bounty for 100K gas offer (at Mangrove's gas price)
uint bounty = mgvr.getProvision(outTk, inbTk, 100_000, 0);
```
{% endcode %}
{% endtab %}

{% tab title="with ethers.js" %}
{% code title="getProvision.js" %}
```javascript
const { ethers } = require("ethers");
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let MGV_reader_address; // address of Mangrove reader
let MGV_reader_abi; // Mangrove Reader contract's abi

const MangroveReader = new ethers.Contract(
    MGV_reader_address, 
    MGV_reader_abi, 
    ethers.provider
    );

const ofr_gasreq = ethers.parseUnits("1",5); //100,000 gas units
const bounty = await MangroveReader.getProvision(outTkn, inbTkn, ofr_gasreq,0);
```
{% endcode %}
{% endtab %}
{% endtabs %}

* `(outbound_tkn, inbound_tkn)` the addresses of the (inbound, outbound) [Offer List](broken-reference/).
* `ofr_gasreq` the max amount of gas that is required to execute the [offer](reactive-offer.md).
* `ofr_gasprice` (in GWei) the gas price the offer maker wishes to compute the **bounty** for (put 0 to use Mangrove's [gas price](../meta-topics/governance.md#gas-price-and-oracle)).
* `bounty` the amount of WEI Mangrove will require to provision in order to accept a new offer with `ofr_gasreq` and `ofr_gasprice` as parameters.

## Provisioning offers

Provisioning Mangrove for offer bounties is done via the following payable function:

{% tabs %}
{% tab title="Signature" %}
```solidity
function fund(address maker) public payable;
```
{% endtab %}

{% tab title="Events" %}
```solidity
// Offer Maker at address `maker` has been credited of `amount` WEIs
event Credit(address maker, uint amount);
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="fund.sol" %}
```solidity
import "./Mangrove.sol";
//context 
Mangrove mgv; // Mangrove contract address
address maker_contract; // address of the maker contract one is willing to provision
// funding maker_contract
mgv.fund{value: 0.1 ether}(maker_contract);

// if funding oneself one can use the overload:
mgv.fund{value: 0.1 ether}();
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="fund.js" %}
```javascript
const { ethers } = require("ethers");
//context
let MGV; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let maker_contract_address; // address of the Maker Contract

const Mangrove = new ethers.Contract(
    MGV, 
    MGV_abi, 
    ethers.provider
    );

let overrides = { value: ethers.parseUnits("0.1", 18) };
// provisioning Mangrove on behalf of MakerContract
await Mangrove["fund(address)"](maker_contract_address, overrides);
```
{% endcode %}
{% endtab %}
{% endtabs %}

* `maker` address of the maker contract one is willing to fund.

## Withdrawing provisions

Bounties that are not locked in an offer are available for the Offer Maker to withdraw.

{% tabs %}
{% tab title="Function" %}
```solidity
function withdraw(uint amount) external returns (bool noRevert);
```
{% endtab %}

{% tab title="Emitted logs" %}
```solidity
event Debit(address maker, uint amount);
```
{% endtab %}

{% tab title="Revert strings" %}
```solidity
// Trying to withdraw unavailable funds
"mgv/insufficientProvision"
```
{% endtab %}

{% tab title="Solidity" %}
```solidity
import "./Mangrove.sol";
//context 
Mangrove mgv; // Mangrove contract

uint wei_balance = mgv.balanceOf(address(this));
require(mgv.withdraw(wei_balance),"Mangrove failed to transfer funds");
```
{% endtab %}

{% tab title="ethers.js" %}
```javascript
const { ethers } = require("ethers");
//context
let MGV; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let maker_contract_address; // address of the Maker Contract
let signer; // tx signer

const Mangrove = new ethers.Contract(
    MGV, 
    MGV_abi, 
    ethers.provider
    );

// only if tx signer has posted a trivial offer
const wei_balance = await Mangrove.balanceOf(signer.address);
if (await Mangrove.callstatic.withdraw(wei_balance)) {
    await Mangrove.connect(signer).withdraw(wei_balance);
} else {
    console.log("Mangrove failed to transfer funds");
}
```
{% endtab %}
{% endtabs %}

* `amount` the amount in WEI one wishes to withdraw from Mangrove's provisions.

{% hint style="danger" %}
**Important points**

* Caller of `withdraw` MUST be the Maker Contract owning the funds on Mangrove
* `amount` to be withdrawn MUST be less or equal than the balance of `msg.sender` on Mangrove (see checking balances below).
* Provisions that are attached to an offer (see [updating](reactive-offer.md#updating-an-existing-offer) or [posting](reactive-offer.md#posting-a-new-reactive-offer) new offers) are locked and not available for withdrawing until offer is deprovisioned (see [retracting offers](reactive-offer.md#retracting-an-offer)).
{% endhint %}
