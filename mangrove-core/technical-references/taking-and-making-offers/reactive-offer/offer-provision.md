---
description: How taker compensation for failing offers works.
---

# Offer provisions

## Summary

When an offer fails, the caller has wasted some gas. To compensate the caller, Mangrove gives them a _bounty_ in native tokens. Offers must provision enough ethers to maximize the chances that Mangrove can compensate the caller. In more details:

* Every offer logic that posted an offer has a balance in ethers held by Mangrove. Funds can be freely added to or withdrawn from the balance.
* Whenever the logic creates or updates an offer, its balance is adjusted so that enough native tokens are locked as the offer's provision.
  * If the offer is retracted that provision is credited back to the logic's account balance.
  * If the offer is executed and fails, part or all of the provision is sent as compensation, to the caller. We call that the bounty. The rest of the provision is credited back to the offer logic's account balance.

## Balance funding & withdrawal

### Funding an offer

There are three ways an offer logic can credit its balance on Mangrove. (1) The logic may either call the `fund` function, or (2) make a call to the fallback function with some value, or (3) pay on the fly when a [new offer is posted](./#posting-a-new-offer).&#x20;

{% tabs %}
{% tab title="Signature" %}
```solidity
function fund(address maker) public payable;
```
{% endtab %}

{% tab title="Events" %}
```solidity
// Offer Maker at address `maker` has been credited of `amount` wei
event Credit(address maker, uint amount);
```
{% endtab %}

{% tab title="Revert string" %}
```solidity
"mgv/dead" // Mangrove contract is no longer live
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="fund.sol" %}
```solidity
import "src/IMangrove.sol";
//context 
IMangrove mgv; // Mangrove contract address
address maker_contract; // address of the maker contract one is willing to provision
// funding maker_contract
mgv.fund{value: 0.1 ether}(maker_contract);

// if funding oneself one can use the overload:
mgv.fund{value: 0.1 ether}();
// which is equivalent to `msg.fund{value:0.1 ether}(address(this))

// to avoid erreoneous transfer of native tokens to Mangrove, the fallback function will also credit `msg.sender`:
(bool noRevert,) = address(mgv).call{value: amount}("");
require(noRevert, "transfer failed");
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

#### Inputs

* `maker` the offer logic's balance on Mangrove to credit

{% hint style="danger" %}
**Do not use `send` or `transfer` to credit Mangrove**&#x20;

Upon receiving funds, Mangrove will credit the amount sent to `maker` (or `msg.sender` if the `receive` function was called). This involves writing to storage, which consumes more gas than the amount given by `send` and `transfer`.
{% endhint %}

### Checking an account balance

```solidity
function balanceOf(address who) external view returns (uint balance);
```

#### Inputs

* `who` The account of which you want to read the balance.

#### Outputs

* `balance` The available balance of `who`.

### Withdrawing

At any time, your available balance can be withdrawn. It may be less than what you deposited: your balance adjusts every time you create/update an offer.

{% tabs %}
{% tab title="Signature" %}
```solidity
function withdraw(uint amount) external returns (bool noRevert);
```
{% endtab %}

{% tab title="Events" %}
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
import "src/IMangrove.sol";
//context 
IMangrove mgv; // Mangrove contract

uint wei_balance = mgv.balanceOf(address(this));
require(mgv.withdraw(wei_balance), "Mangrove failed to transfer funds");
```
{% endtab %}
{% endtabs %}

#### Inputs

* `amount` the amount of ethers (in wei) one wishes to withdraw from Mangrove's provisions.

#### Outputs

* `noRevert` whether the ether transfer was successful.

{% hint style="danger" %}
**Important points**

* The account credited will be `msg.sender`.
* `amount` must be $$\leq$$ your available balance (available with `balanceOf`)
{% endhint %}

## Balance adjustment when creating/updating offers

Whenever an offer is created or updated, Mangrove applies to following formula to get the offer's required provision in wei:

$$\textrm{provision} = \max(\textrm{gasprice}_{\textrm{mgv}},\textrm{gasprice}_{\textrm{ofr}}) \times (\textrm{gasreq} + \textrm{gasbase}_{\textrm{mgv}}) \times 10^9$$​

* $$\textrm{gasprice}_{\textrm{mgv}}$$ is the `gasprice` [global governance parameter](../../governance-parameters/global-variables.md#gas-price-and-oracle) (in gwei per gas units)
* $$\textrm{gasprice}_{\textrm{ofr}}$$ is the `gasprice` argument of the function being called ([`newOffer`](./#posting-a-new-offer) or [`updateOffer`](./#updating-an-existing-offer)) also in gwei per gas units.
* $$\textrm{gasreq}$$ is the `gasreq` argument of the function being called (in gas units).
* $$\textrm{gasbase}_{\rm mgv}$$is the `offer_gasbase` [local governance parameter](../../governance-parameters/local-variables.md#offer-gas-base).

Mangrove will adjust the balance of the caller to ensure that $$\textrm{provision}$$ wei are available as bounty if the offer fails. If the offer was _already_ provisioned, the adjustment may be small, and the balance may actually increase -- for instance, if the `gasprice` dropped recently.

{% hint style="info" %}
**Incentivized book cleaning**

Provisions are calculated so that, within reasonable gas estimates, taking a failing offer should be profitable for the taker.
{% endhint %}

{% hint style="success" %}
**Gas optimization**

If you frequently update your offers, we recommend using a consistent, high `gasprice` argument, above the actual expected gas prices. Not changing `gasprice` when you call `updateOffer` will make the call cheaper (you save one `SSTORE`).
{% endhint %}

## Provision and offer bounty

{% tabs %}
{% tab title="Solidity snippet" %}
{% code title="getProvision.sol" %}
```solidity
import "src/IMangrove.sol";
import {MgvStructs} from "src/MgvLib.sol";
//context 
IMangrove mgv;
address outbound_tkn;
address inbound_tkn;
uint offer_gasreq;
(MgvStructs.GlobalPacked global32, MgvStructs.LocalPacked local32) = mgv.config(outbound_tkn, inbound_tkn);

// computing minimal provision to cover an offer requiring `offer_gasreq` gas units 
uint provision = (offer_gasreq + local32.offer_gasbase()) * global32.gasprice() * 10 ** 9;
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

{% hint style="warning" %}
**Applied bounty**

Suppose an offer requires $$g_{\mathsf{ofr}}$$​ gas units to execute. As explained above, Mangrove will require the logic posting the offer to provision $$\beta$$ WEI. Suppo se the offer is executed during a Taker Order and fails after $$g_{\mathsf{used}}$$gas units ($$g_\mathsf{used}<g_\mathsf{ofr}$$). The portion of the bounty that will be transferred to the Offer Taker's account is $$\dot G*(\dot g_0/n+\dot g_1+g_\mathsf{used})$$ where $$\dot G$$​, $$\dot g_0$$, $$n$$ and $$\dot g_1$$are respectively the [`global.gasprice`](broken-reference), [`local.overhead_gasbase`](broken-reference), the number of offers executed during the take order, and the [`local.offer_gasbase`](broken-reference) values _at the time the offer is taken_ (which may differ from their values at the time the offer was posted, as a consequence of some parameter changes by the governance).
{% endhint %}
